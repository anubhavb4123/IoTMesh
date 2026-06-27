/*
 * ═══════════════════════════════════════════════════════════════════
 *  IoTMesh ESP32 — GitHub HTTPS OTA Updater  v2.0
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Architecture (v2.0 — GitHub Releases based):
 *  ─────────────────────────────────────────────
 *  1. ESP32 polls Firebase RTDB at "ota/latest.json" every 30 s
 *  2. Compares latest_version vs CURRENT_FW_VERSION
 *  3. If latest > current: downloads the .bin DIRECTLY from the
 *     GitHub Releases CDN URL (stored in ota/latest/firmware_url)
 *  4. Streams the raw binary through WiFiClientSecure → Update library
 *     (No base64 encoding needed — much faster & memory-efficient)
 *  5. Verifies write success → reboots
 *
 *  Firebase node structure (written by server/index.js):
 *    ota/latest/
 *      version       — e.g. "2.1.0"
 *      firmware_url  — https://github.com/.../releases/download/.../.bin
 *      board         — "ESP32" | "ESP8266"
 *      release_notes — short description
 *      uploaded_at   — Unix ms timestamp
 *
 *  Safety:
 *  • Only flashes if latest_version > current_version (string compare)
 *  • If download fails → keeps current firmware, retries on next poll
 *  • If Update.end() fails → aborts, current firmware intact
 *
 *  Required Libraries (install via Library Manager):
 *  • ArduinoJson  >= 7.x
 *  • WiFi.h / WiFiClientSecure.h / HTTPClient.h / Update.h (all built-in)
 *
 *  ════════════════════════════════════════════════════════════════
 *  DO NOT REMOVE: existing relay / sensor / Firebase functionality
 *  is not touched by this file — OTA is a standalone polling loop.
 *  ════════════════════════════════════════════════════════════════
 */

// ── System Headers ────────────────────────────────────────────────
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Update.h>
#include <ArduinoJson.h>
#include <Preferences.h>   // NVS: persist current version across reboots
#include "esp_partition.h"

// ═══════════════════════════════════════════════════════════════════
//  USER CONFIGURATION — Edit these values for your setup
// ═══════════════════════════════════════════════════════════════════

// ── WiFi ──────────────────────────────────────────────────────────
const char* WIFI_SSID     = "12345";
const char* WIFI_PASSWORD = "88888888";

// ── Firebase ──────────────────────────────────────────────────────
// Realtime Database REST base URL (no trailing slash)
const char* FIREBASE_DB_URL = "https://iotmesh-4123-default-rtdb.firebaseio.com";

// Database Secret — get from:
// Firebase Console → Project Settings → Service Accounts → Database Secrets
// ⚠️  Never expose this in public code. Store in firmware only.
const char* FIREBASE_AUTH = "ItjOcSIaW6GRLAnZLhIi1ouEFFwfCYiQR5cqsmwi";

// ── Firmware version ──────────────────────────────────────────────
// UPDATE THIS in every new build. Must match the version you upload
// from the Admin Panel so the ESP knows to skip re-flashing.
// Format: "MAJOR.MINOR.PATCH"  (e.g. "1.0.0", "2.1.3")
const char* COMPILED_FW_VERSION = "1.0.0";

// ── Preferences (NVS) namespace ───────────────────────────────────
// Used to persist the current version after a successful OTA flash.
const char* NVS_NAMESPACE   = "iotmesh";
const char* NVS_KEY_VERSION = "fw_version";

// ── OTA polling ───────────────────────────────────────────────────
const unsigned long OTA_CHECK_INTERVAL_MS = 30000; // 30 seconds

// ── LED ───────────────────────────────────────────────────────────
#define LED_PIN 2

// ═══════════════════════════════════════════════════════════════════
//  GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════
Preferences prefs;
String      currentFwVersion;          // read from NVS or fall back to compiled constant
unsigned long lastOtaCheckMs  = 0;
unsigned long previousMillis  = 0;
bool          ledState        = false;

// ── Forward declarations ──────────────────────────────────────────
void     checkForOtaUpdate();
bool     performHttpsOta(const String& firmwareUrl, const String& newVersion);
bool     versionIsNewer(const String& latest, const String& current);
String   readStoredVersion();
void     storeVersion(const String& version);
void     connectWifi();
void     blinkFast(int times);

// ═══════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("═══════════════════════════════════════════════");
  Serial.println("  IoTMesh ESP32 — GitHub HTTPS OTA v2.0");
  Serial.println("═══════════════════════════════════════════════");

  // ── Print Active Partition Table ─────────────────────────────
  Serial.println("[System] Listing Partition Table:");
  esp_partition_iterator_t it = esp_partition_find(ESP_PARTITION_TYPE_ANY, ESP_PARTITION_SUBTYPE_ANY, NULL);
  while (it != NULL) {
    const esp_partition_t *part = esp_partition_get(it);
    Serial.printf(" - Type: %d, Subtype: %d, Address: 0x%06X, Size: %d (%.2f KB), Label: %s\n",
                  part->type, part->subtype, part->address, part->size, part->size / 1024.0, part->label);
    it = esp_partition_next(it);
  }
  esp_partition_iterator_release(it);
  Serial.println("═══════════════════════════════════════════════");

  pinMode(LED_PIN, OUTPUT);

  // ── Read persisted firmware version from NVS ──────────────────
  prefs.begin(NVS_NAMESPACE, false);
  currentFwVersion = readStoredVersion();
  Serial.printf("[OTA] Compiled version : %s\n", COMPILED_FW_VERSION);
  Serial.printf("[OTA] Stored version   : %s\n", currentFwVersion.c_str());

  // If NVS is empty (first boot), seed from compiled constant
  if (currentFwVersion.isEmpty()) {
    currentFwVersion = String(COMPILED_FW_VERSION);
    storeVersion(currentFwVersion);
    Serial.printf("[OTA] Initialised NVS version to: %s\n", currentFwVersion.c_str());
  }

  // ── Connect to WiFi ───────────────────────────────────────────
  connectWifi();

  Serial.println("[OTA] OTA checker active — polling Firebase every 30 s");
  Serial.println("═══════════════════════════════════════════════");
}

// ═══════════════════════════════════════════════════════════════════
//  LOOP
// ═══════════════════════════════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // ── Heartbeat LED blink (1 Hz) ─────────────────────────────────
  if (now - previousMillis >= 1000) {
    previousMillis = now;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
  }

  // ── Reconnect WiFi if dropped ──────────────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Connection lost — reconnecting...");
    connectWifi();
  }

  // ── OTA check on interval ──────────────────────────────────────
  if (now - lastOtaCheckMs >= OTA_CHECK_INTERVAL_MS) {
    lastOtaCheckMs = now;
    checkForOtaUpdate();
  }

  // ── Add your existing sensor / relay / Firebase logic here ──────
  // (This function intentionally left minimal — keep other logic
  //  in its own functions as in your original sketch.)
}

// ═══════════════════════════════════════════════════════════════════
//  WiFi connection helper
// ═══════════════════════════════════════════════════════════════════
void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] ⚠️  Connection failed — will retry on next loop");
  }
}

// ═══════════════════════════════════════════════════════════════════
//  NVS helpers
// ═══════════════════════════════════════════════════════════════════

/** Read the persisted firmware version from NVS. Returns empty String if unset. */
String readStoredVersion() {
  return prefs.getString(NVS_KEY_VERSION, "");
}

/** Write the new firmware version to NVS. */
void storeVersion(const String& version) {
  prefs.putString(NVS_KEY_VERSION, version);
}

// ═══════════════════════════════════════════════════════════════════
//  Version comparison
//  Returns true only when 'latest' is strictly greater than 'current'.
//  Compares as MAJOR.MINOR.PATCH integers.
// ═══════════════════════════════════════════════════════════════════
bool versionIsNewer(const String& latest, const String& current) {
  // Helper: parse "X.Y.Z" into three integers
  auto parseVersion = [](const String& v, int& major, int& minor, int& patch) {
    int first  = v.indexOf('.');
    int second = v.indexOf('.', first + 1);
    if (first < 0 || second < 0) {
      major = minor = patch = 0;
      return;
    }
    major = v.substring(0, first).toInt();
    minor = v.substring(first + 1, second).toInt();
    patch = v.substring(second + 1).toInt();
  };

  int lMaj, lMin, lPat;
  int cMaj, cMin, cPat;
  parseVersion(latest,  lMaj, lMin, lPat);
  parseVersion(current, cMaj, cMin, cPat);

  if (lMaj != cMaj) return lMaj > cMaj;
  if (lMin != cMin) return lMin > cMin;
  return lPat > cPat;
}

// ═══════════════════════════════════════════════════════════════════
//  Poll Firebase RTDB for the latest OTA metadata
// ═══════════════════════════════════════════════════════════════════
void checkForOtaUpdate() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[OTA] WiFi not connected — skipping check");
    return;
  }

  Serial.println();
  Serial.println("[OTA] ────────────────────────────────────────");
  Serial.println("[OTA] Checking OTA...");
  Serial.printf ("[OTA] Current Version: %s\n", currentFwVersion.c_str());

  // ── Build REST URL for ota/latest ─────────────────────────────
  String url = String(FIREBASE_DB_URL)
             + "/ota/latest.json?auth="
             + FIREBASE_AUTH;

  HTTPClient http;
  http.begin(url);
  http.setTimeout(10000); // 10 s timeout

  int httpCode = http.GET();
  if (httpCode != 200) {
    Serial.printf("[OTA] Firebase HTTP error: %d\n", httpCode);
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  // ── Parse JSON ────────────────────────────────────────────────
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.printf("[OTA] JSON parse error: %s\n", err.c_str());
    return;
  }

  // Null means no firmware has been deployed yet
  if (doc.isNull()) {
    Serial.println("[OTA] No firmware deployed yet — skipping");
    return;
  }

  const char* latestVersion = doc["version"]      | "";
  const char* firmwareUrl   = doc["firmware_url"] | "";
  const char* board         = doc["board"]         | "ESP32";
  const char* releaseNotes  = doc["release_notes"] | "";

  if (strlen(latestVersion) == 0 || strlen(firmwareUrl) == 0) {
    Serial.println("[OTA] Incomplete ota/latest record — skipping");
    return;
  }

  Serial.printf("[OTA] Latest Version : %s (%s)\n", latestVersion, board);
  if (strlen(releaseNotes) > 0) {
    Serial.printf("[OTA] Release Notes  : %s\n", releaseNotes);
  }

  // ── Version compare ───────────────────────────────────────────
  if (!versionIsNewer(String(latestVersion), currentFwVersion)) {
    Serial.println("[OTA] Already up to date — no update needed");
    Serial.println("[OTA] ────────────────────────────────────────");
    return;
  }

  Serial.printf("[OTA] New version available: %s → %s\n",
                currentFwVersion.c_str(), latestVersion);
  Serial.println("[OTA] Downloading...");

  // Rapid blink to indicate OTA in progress
  blinkFast(10);

  // ── Perform HTTPS OTA ─────────────────────────────────────────
  bool success = performHttpsOta(String(firmwareUrl), String(latestVersion));

  if (success) {
    Serial.println("[OTA] ✅ OTA Successful");
    Serial.println("[OTA] Restarting...");

    // Persist the new version BEFORE rebooting so we don't re-flash on boot
    storeVersion(String(latestVersion));
    prefs.end();

    delay(500);
    ESP.restart();
  } else {
    Serial.println("[OTA] ❌ OTA Failed — keeping current firmware");
    Serial.println("[OTA] Will retry on next poll cycle");
  }

  Serial.println("[OTA] ────────────────────────────────────────");
}

// ═══════════════════════════════════════════════════════════════════
//  Perform HTTPS OTA from GitHub Releases CDN
//  Uses WiFiClientSecure (setInsecure for GitHub CDN)
// ═══════════════════════════════════════════════════════════════════
bool performHttpsOta(const String& firmwareUrl, const String& newVersion) {
  Serial.printf("[OTA] URL: %s\n", firmwareUrl.c_str());

  // ── Set up a secure client ────────────────────────────────────
  // GitHub Releases are served over HTTPS. We use setInsecure() here
  // because embedding the full GitHub root CA chain is fragile (CAs rotate).
  // For production with a private CDN, embed the specific root CA instead.
  WiFiClientSecure client;
  client.setInsecure(); // Accept any valid HTTPS certificate
  client.setTimeout(30); // 30 s socket timeout

  // ── Follow redirects manually if needed ──────────────────────
  // GitHub download URLs often 302-redirect to objects.githubusercontent.com
  HTTPClient http;
  http.begin(client, firmwareUrl);
  http.setTimeout(60000);  // 60 s total timeout for large downloads
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  Serial.println("[OTA] Installing...");
  int httpCode = http.GET();

  if (httpCode != 200) {
    Serial.printf("[OTA] ❌ HTTP GET failed: %d\n", httpCode);
    Serial.printf("[OTA] Error: %s\n", http.errorToString(httpCode).c_str());
    http.end();
    return false;
  }

  // ── Determine binary size from Content-Length header ─────────
  int contentLength = http.getSize();
  Serial.printf("[OTA] Firmware size: %d bytes\n", contentLength);

  if (contentLength <= 0) {
    Serial.println("[OTA] ❌ Unknown content length — cannot safely OTA");
    http.end();
    return false;
  }

  // ── Begin OTA Update ──────────────────────────────────────────
  if (!Update.begin(contentLength)) {
    Serial.printf("[OTA] ❌ Update.begin() failed: %s\n", Update.errorString());
    http.end();
    return false;
  }

  // ── Stream binary to flash ────────────────────────────────────
  WiFiClient* stream  = http.getStreamPtr();
  size_t bytesWritten = 0;
  uint8_t buf[1024];
  unsigned long lastProgress = 0;
  unsigned long streamTimeout = millis();
  bool streamOk = false;

  Serial.println("[OTA] Streaming firmware to flash...");

  while (http.connected() && bytesWritten < (size_t)contentLength) {
    // Wait for data with a generous timeout
    if (!stream->available()) {
      if (millis() - streamTimeout > 15000) {
        Serial.println("\n[OTA] ❌ Stream timeout");
        break;
      }
      delay(10);
      continue;
    }

    // Reset stream timeout whenever data arrives
    streamTimeout = millis();

    // Read a chunk
    size_t available = stream->available();
    size_t toRead    = min(available, sizeof(buf));
    size_t nRead     = stream->readBytes(buf, toRead);

    if (nRead == 0) continue;

    size_t nWritten = Update.write(buf, nRead);
    if (nWritten != nRead) {
      Serial.printf("\n[OTA] ❌ Write mismatch: read=%d written=%d — %s\n",
                    nRead, nWritten, Update.errorString());
      break;
    }

    bytesWritten += nWritten;

    // Log progress every 500 ms
    if (millis() - lastProgress >= 500) {
      lastProgress = millis();
      int pct = (int)((bytesWritten * 100) / contentLength);
      Serial.printf("[OTA] Download Progress: %d%% (%d / %d bytes)\r",
                    pct, bytesWritten, contentLength);
      // Blink LED during download
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  }

  Serial.println(); // newline after progress prints

  http.end();

  // ── Verify byte count ─────────────────────────────────────────
  if (bytesWritten != (size_t)contentLength) {
    Serial.printf("[OTA] ❌ Size mismatch: expected=%d got=%d\n",
                  contentLength, bytesWritten);
    Update.abort();
    return false;
  }

  Serial.printf("[OTA] Written: %d / %d bytes\n", bytesWritten, contentLength);

  // ── Finalise OTA ──────────────────────────────────────────────
  if (!Update.end(true)) {
    Serial.printf("[OTA] ❌ Update.end() failed: %s\n", Update.errorString());
    return false;
  }

  if (!Update.isFinished()) {
    Serial.println("[OTA] ❌ Update not marked finished");
    return false;
  }

  Serial.println("[OTA] ✅ Firmware written and verified successfully!");
  return true;
}

// ═══════════════════════════════════════════════════════════════════
//  Rapid LED blink helper (visual indicator during OTA start)
// ═══════════════════════════════════════════════════════════════════
void blinkFast(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(80);
    digitalWrite(LED_PIN, LOW);
    delay(80);
  }
}
