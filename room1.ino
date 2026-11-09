/*
 * IoTMesh - Room 1 Hybrid Smart Controller (ESP32-C3 Super Mini)
 *
 * Local switches run in a small, independent task so a slow TLS connection,
 * Firebase outage, NTP failure, or OTA handler cannot stop switch scanning.
 * Firebase is accessed only from loop(), using one manually polled stream.
 * Pin mapping, switch modes, RTDB keys, fan speed semantics and OTA are retained.
 */
#include "SwitchCommands.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoOTA.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <time.h>
#include "driver/temp_sensor.h"
#include "esp_bt.h"
#include "esp_system.h"

// =================================================================================
//  2. NETWORK & FIREBASE CONFIGURATION
// =================================================================================
#define WIFI_SSID               "BAJPAI_2.4Ghz"               // Your WiFi Network SSID
#define WIFI_PASSWORD           "44444422"                   // Your WiFi Password

// Wi-Fi RF Transmit (TX) Power:
// ESP32-C3 Super Mini boards can suffer from brownout reboots or connection drops
// when transmitting at default maximum power (19.5dBm).
// Setting TX power to 8.5dBm (or 10dBm) provides rock-solid stability and prevents voltage sags.
// - WIFI_POWER_8_5dBm  : 8.5 dBm (Recommended for ESP32-C3 Super Mini stability)
// - (wifi_power_t)40   : 10.0 dBm (40 * 0.25 dBm)
#define WIFI_TX_POWER           WIFI_POWER_8_5dBm

// Firebase Project Credentials
#define FIREBASE_HOST           "https://iotmesh-4123-default-rtdb.firebaseio.com/"
#define FIREBASE_DB_SECRET      "ItjOcSIaW6GRLAnZLhIi1ouEFFwfCYiQR5cqsmwi"  // Firebase Console -> Project Settings -> Service Accounts -> Database secrets

// Realtime Database Paths
#ifndef IOTMESH_ROOM_NODE
#define IOTMESH_ROOM_NODE "room1"
#endif
#define FB_PATH_COMMANDS        "/switchControl/" IOTMESH_ROOM_NODE "/commands"
#define FB_PATH_REPORTS         "/switchControl/" IOTMESH_ROOM_NODE "/reports"
#define FB_PATH_STATUS          "/home/" IOTMESH_ROOM_NODE "/status"

// OTA (Over-The-Air) Update Configuration
#define OTA_HOSTNAME            "IoTMesh-" IOTMESH_ROOM_NODE
#define OTA_PASSWORD            "room1ota123"     // Password required to push OTA update (change this!)

// =================================================================================
//  3. PIN DEFINITIONS & HARDWARE CONFIGURATION
// =================================================================================

// Relay Output Pins
#define RELAY1_PIN              21   // Room 1 Light Relay
#define RELAY2_PIN              20   // Room 1 Wall Switch Relay
#define RELAY3_PIN              5    // Room 1 Fan Relay  ✅ (was GPIO 9 - BOOT strapping pin, unsafe!)

// Physical Switch Input Pins (Connected to 3.3V)
#define SWITCH1_PIN             1    // Room 1 Light Switch
#define SWITCH2_PIN             4    // Room 1 Wall Switch  ✅ (was GPIO 0 - boot strapping pin, unsafe!)
#define SWITCH3_PIN             3    // Room 1 Fan Switch

// Switch Electrical Configuration:
// Switches connect to 3.3V (3V pin), utilizing internal pull-down resistors.
#define SWITCH_CONNECTED_TO_3V  true

#if SWITCH_CONNECTED_TO_3V
  #define SWITCH_PIN_MODE       INPUT_PULLDOWN
  #define SWITCH_ACTIVE_LEVEL   HIGH             // Switch ON (connected to 3.3V)
  #define SWITCH_INACTIVE_LEVEL LOW              // Switch OFF (pulled down to GND)
#else
  #define SWITCH_PIN_MODE       INPUT_PULLUP
  #define SWITCH_ACTIVE_LEVEL   LOW              // Switch ON (connected to GND)
  #define SWITCH_INACTIVE_LEVEL HIGH             // Switch OFF (pulled up to 3.3V)
#endif

// Relay Trigger Level:
// Set to 'false' for Active-HIGH relays (HIGH = ON, LOW = OFF)
// Set to 'true' for Active-LOW relays
#define RELAY_ACTIVE_LOW        false

#if RELAY_ACTIVE_LOW
  #define RELAY_ON              LOW
  #define RELAY_OFF             HIGH
#else
  #define RELAY_ON              HIGH
  #define RELAY_OFF             LOW
#endif

// Operating Mode:
// - true  : Smart Two-Way Toggle Mode.
//           Any flip of the wall switch toggles the relay, regardless of current state.
//           ⚠️ Can cause unexpected toggles if device was turned ON from the web.
// - false : Direct Follow Mode (Switch ON = Relay ON, Switch OFF = Relay OFF).
//           ✅ Recommended: Physical switch position always reflects the device state.
//           If device is ON from web and switch is flipped ON → stays ON (no surprise toggle).
#define SMART_TOGGLE_MODE       false

// Timing Constants
const unsigned long DEBOUNCE_DELAY_MS        = 50;
const unsigned long WIFI_CHECK_INTERVAL_MS   = 5000;  // Check WiFi health every 5s
const unsigned long WIFI_RETRY_INTERVAL_MS   = 20000; // When offline, retry WiFi every 20s
const unsigned long HEARTBEAT_INTERVAL_MS    = 15000; // Push online status every 15s

// Shared relay state is protected only for short GPIO/state operations.
// Never hold stateMux while allocating, logging, or calling network APIs.
struct Channel {
  const char* firebaseKey;
  uint8_t switchPin;
  uint8_t relayPin;
  bool relayState;
  bool pendingSync;
  uint8_t lastReading;
  uint8_t stableState;
  unsigned long lastDebounceTime;
  uint32_t revision;
};

Channel channels[] = {
  { "light",  SWITCH1_PIN, RELAY1_PIN, false, false, SWITCH_INACTIVE_LEVEL, SWITCH_INACTIVE_LEVEL, 0, 0 },
  { "switch", SWITCH2_PIN, RELAY2_PIN, false, false, SWITCH_INACTIVE_LEVEL, SWITCH_INACTIVE_LEVEL, 0, 0 },
  { "fan",    SWITCH3_PIN, RELAY3_PIN, false, false, SWITCH_INACTIVE_LEVEL, SWITCH_INACTIVE_LEVEL, 0, 0 }
};
const uint8_t NUM_CHANNELS = sizeof(channels) / sizeof(channels[0]);
const uint8_t FAN_CHANNEL = 2;
const unsigned long SWITCH_POLL_MS = 5;
const unsigned long REPORT_BATCH_MS = 100;
const unsigned long CLOUD_RETRY_MIN_MS = 5000;
const unsigned long CLOUD_RETRY_MAX_MS = 60000;
const unsigned long NTP_GRACE_MS = 8000;
const unsigned long CLOCK_VALID_AFTER = 1609459200UL; // 2021-01-01 UTC

portMUX_TYPE stateMux = portMUX_INITIALIZER_UNLOCKED;
int currentFanSpeed = 0;
char commandIds[NUM_CHANNELS][SwitchCommands::IdLength + 1] = {};
uint64_t commandIssuedAt[NUM_CHANNELS] = {};
bool commandApplied[NUM_CHANNELS] = {};
unsigned long lastReportHeartbeat = 0;
bool switchTaskStarted = false;

// Unsigned elapsed-time arithmetic also works across the millis() rollover.
struct RetryTimer {
  unsigned long lastFailure = 0;
  unsigned long waitMs = 0;
  bool ready(unsigned long now) const {
    return waitMs == 0 || now - lastFailure >= waitMs;
  }
  void failed() {
    lastFailure = millis(); // Backoff starts AFTER the blocking request finishes.
    waitMs = waitMs == 0 ? CLOUD_RETRY_MIN_MS :
             (waitMs >= CLOUD_RETRY_MAX_MS / 2 ? CLOUD_RETRY_MAX_MS : waitMs * 2);
  }
  void reset() { waitMs = 0; }
};

FirebaseData fbdoStream;
FirebaseData fbdoWrite;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;
FirebaseJson writeJson; // Reused for control batches and status, never simultaneously.
RetryTimer streamRetry;
RetryTimer writeRetry;
bool firebaseInitialized = false;
bool firebaseStreamActive = false;
bool isOnlineMode = false;
bool otaInitialized = false;
bool clockStarted = false;
bool temperatureSensorReady = false;
unsigned long lastWifiCheck = 0;
unsigned long lastWifiRetry = 0;
unsigned long lastHeartbeat = 0;
unsigned long clockStartedAt = 0;
String localIp;

void applyRelayState(Channel &ch);
void handlePhysicalSwitches();
void toggleRelayFromSwitch(uint8_t index);
void switchTask(void *parameter);
void connectWiFiNonBlocking();
void handleNetworkHealth();
void initializeFirebase();
void setupFirebaseStream();
bool syncPendingStatesToFirebase();
void updateFirebaseHeartbeat();
void handleStreamEvent();
void initializeOTA();

void setup() {
  Serial.begin(115200);

  // Set safe relay levels before enabling outputs; no startup delay.
  for (uint8_t i = 0; i < NUM_CHANNELS; ++i) {
    Channel &ch = channels[i];
    digitalWrite(ch.relayPin, RELAY_OFF);
    ch.pendingSync = true;
    pinMode(ch.relayPin, OUTPUT);
    pinMode(ch.switchPin, SWITCH_PIN_MODE);
    ch.lastReading = ch.stableState = digitalRead(ch.switchPin);
    ch.lastDebounceTime = millis();
#if !SMART_TOGGLE_MODE
    ch.relayState = ch.stableState == SWITCH_ACTIVE_LEVEL;
#endif
    applyRelayState(ch);
  }
  Serial.printf("[System] Reset reason: %d\n", static_cast<int>(esp_reset_reason()));

  // No TLS, JSON, Strings or Serial calls in this 2 KiB task. It replaces the
  // Firebase callback task (8 KiB by default) rather than adding another one.
  switchTaskStarted = xTaskCreate(switchTask, "Room1Switches", 2048, nullptr,
                                 2, nullptr) == pdPASS;
  if (!switchTaskStarted) {
    Serial.println(F("[System] Switch task unavailable; staying in local-only mode."));
    return;
  }

  btStop();
#if defined(CONFIG_IDF_TARGET_ESP32C3) || defined(CONFIG_IDF_TARGET_ESP32S3)
  esp_bt_controller_mem_release(ESP_BT_MODE_BLE);
#endif

  temp_sensor_config_t tempConfig = TSENS_CONFIG_DEFAULT();
  temperatureSensorReady = temp_sensor_set_config(tempConfig) == ESP_OK;
  if (temperatureSensorReady) temperatureSensorReady = temp_sensor_start() == ESP_OK;

  localIp.reserve(16);
  Serial.println(F("[System] IoTMesh " IOTMESH_ROOM_NODE " ready. Local switches active."));
  connectWiFiNonBlocking();
  handleNetworkHealth();
}

void loop() {
  if (!switchTaskStarted) {
    handlePhysicalSwitches();
    delay(SWITCH_POLL_MS);
    return;
  }

  if (millis() - lastWifiCheck >= WIFI_CHECK_INTERVAL_MS) {
    lastWifiCheck = millis();
    handleNetworkHealth();
  }

  if (WiFi.status() == WL_CONNECTED && isOnlineMode) {
    if (otaInitialized) ArduinoOTA.handle();
    if (!firebaseInitialized) initializeFirebase();
    if (firebaseInitialized && Firebase.ready()) {
      if (!firebaseStreamActive && streamRetry.ready(millis()) && SwitchCommands::nowMs()) setupFirebaseStream();
      if (firebaseStreamActive) {
        if (!Firebase.RTDB.readStream(&fbdoStream)) {
          Serial.printf("[Firebase] Stream read failed (HTTP %d). Retrying later.\n",
                        fbdoStream.httpCode());
          Firebase.RTDB.endStream(&fbdoStream);
          firebaseStreamActive = false;
          streamRetry.failed();
        } else if (fbdoStream.streamAvailable()) {
          handleStreamEvent();
        }
      }

      // At most one write per pass. A failed write backs off both controls and
      // heartbeats, while stream reads and OTA remain enabled between attempts.
      if (writeRetry.ready(millis()) && !syncPendingStatesToFirebase() &&
          millis() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        updateFirebaseHeartbeat();
      }
    }
  }

  // yield() alone does not let the idle task run on a busy single-core C3.
  delay(5);
}

void switchTask(void *parameter) {
  (void)parameter;
  for (;;) {
    handlePhysicalSwitches();
    vTaskDelay(pdMS_TO_TICKS(SWITCH_POLL_MS) > 0 ? pdMS_TO_TICKS(SWITCH_POLL_MS) : 1);
  }
}

void handlePhysicalSwitches() {
  const unsigned long now = millis();
  for (uint8_t i = 0; i < NUM_CHANNELS; ++i) {
    Channel &ch = channels[i];
    const uint8_t reading = digitalRead(ch.switchPin);
    if (reading != ch.lastReading) ch.lastDebounceTime = now;
    if (now - ch.lastDebounceTime > DEBOUNCE_DELAY_MS && reading != ch.stableState) {
      ch.stableState = reading;
      toggleRelayFromSwitch(i);
    }
    ch.lastReading = reading;
  }
}

void toggleRelayFromSwitch(uint8_t index) {
  portENTER_CRITICAL(&stateMux);
  Channel &ch = channels[index];
#if SMART_TOGGLE_MODE
  ch.relayState = !ch.relayState;
#else
  ch.relayState = ch.stableState == SWITCH_ACTIVE_LEVEL;
#endif
  if (index == FAN_CHANNEL) {
    currentFanSpeed = ch.relayState ? (currentFanSpeed > 0 ? currentFanSpeed : 3) : 0;
  }
  applyRelayState(ch);
  ch.pendingSync = true;
  ++ch.revision;
  portEXIT_CRITICAL(&stateMux);
}

// Called at startup or with stateMux held. Keep this allocation/logging-free.
void applyRelayState(Channel &ch) {
  digitalWrite(ch.relayPin, ch.relayState ? RELAY_ON : RELAY_OFF);
}

bool syncPendingStatesToFirebase() {
  static bool batching = false;
  static unsigned long batchStartedAt = 0;
  bool pending[NUM_CHANNELS];
  bool states[NUM_CHANNELS];
  uint32_t revisions[NUM_CHANNELS];
  int fanSpeed;
  bool anyPending = false;

  // Snapshot first. Physical switches remain free to change during HTTPS.
  portENTER_CRITICAL(&stateMux);
  for (uint8_t i = 0; i < NUM_CHANNELS; ++i) {
    pending[i] = channels[i].pendingSync;
    states[i] = channels[i].relayState;
    revisions[i] = channels[i].revision;
    anyPending |= pending[i];
  }
  fanSpeed = currentFanSpeed;
  portEXIT_CRITICAL(&stateMux);

  const unsigned long now = millis();
  if (anyPending) {
    // Give the relay time to settle after the first change and share the write
    // with any other changes in this window. A pending report takes precedence
    // over telemetry, even while its batch window is still open.
    if (!batching) {
      batching = true;
      batchStartedAt = now;
    }
    if (now - batchStartedAt < REPORT_BATCH_MS) return true;
  } else if (now - lastReportHeartbeat < HEARTBEAT_INTERVAL_MS) {
    return false;
  }

  writeJson.set("heartbeatAt/.sv", "timestamp");
  for (uint8_t i = 0; i < NUM_CHANNELS; ++i) {
    if (!pending[i]) continue;
    SwitchCommands::addReport(writeJson, channels[i].firebaseKey, states[i],
                              i == FAN_CHANNEL ? fanSpeed : -1, commandIds[i], commandApplied[i]);
  }

  const bool synced = Firebase.RTDB.updateNodeSilent(&fbdoWrite, FB_PATH_REPORTS, &writeJson);
  writeJson.clear();
  if (synced) {
    batching = false;
    lastReportHeartbeat = millis();
    portENTER_CRITICAL(&stateMux);
    for (uint8_t i = 0; i < NUM_CHANNELS; ++i) {
      if (pending[i] && channels[i].revision == revisions[i]) channels[i].pendingSync = false;
    }
    portEXIT_CRITICAL(&stateMux);
    writeRetry.reset();
  } else {
    writeRetry.failed();
    Serial.printf("[Firebase] Control sync failed (HTTP %d); retry in %lu ms.\n",
                  fbdoWrite.httpCode(), writeRetry.waitMs);
  }
  return true;
}

void setupFirebaseStream() {
  if (Firebase.RTDB.beginStream(&fbdoStream, FB_PATH_COMMANDS)) {
    // Manual polling ONLY: setStreamCallback would create a second reader/task.
    firebaseStreamActive = true;
    streamRetry.reset();
    Serial.println(F("[Firebase] Controls stream connected."));
  } else {
    streamRetry.failed();
    Serial.printf("[Firebase] Stream start failed (HTTP %d); retry in %lu ms.\n",
                  fbdoStream.httpCode(), streamRetry.waitMs);
  }
}

void handleStreamEvent() {
  if (fbdoStream.dataType() != "json") return;
  FirebaseJson *json = fbdoStream.jsonObjectPtr();
  if (!json) return;
  const String path = fbdoStream.dataPath();

  for (uint8_t i = 0; i < NUM_CHANNELS; ++i) {
    Channel &channel = channels[i];
    SwitchCommands::Command command;
    if (!SwitchCommands::read(*json, path, channel.firebaseKey, commandIds[i], commandIssuedAt[i], command)) continue;

    const bool valid = command.speed < 0 ||
                       (i == FAN_CHANNEL && command.value == (command.speed > 0));
    portENTER_CRITICAL(&stateMux);
    if (valid) {
      channel.relayState = command.value;
      if (i == FAN_CHANNEL) {
        if (!command.value) currentFanSpeed = 0;
        else if (command.speed > 0) currentFanSpeed = command.speed;
        else if (currentFanSpeed == 0) currentFanSpeed = 3;
      }
      applyRelayState(channel);
    }
    channel.pendingSync = true;
    ++channel.revision;
    portEXIT_CRITICAL(&stateMux);

    memcpy(commandIds[i], command.id, sizeof(command.id));
    commandIssuedAt[i] = command.issuedAt;
    commandApplied[i] = valid;
  }
  json->clear(); // The stream keeps its raw event. Release the parsed tree now.
}

void updateFirebaseHeartbeat() {
  writeJson.set("online", true);
  writeJson.set("ip", localIp);
  writeJson.set("rssi", WiFi.RSSI());
  writeJson.set("uptime", (unsigned long)(millis() / 1000));
  writeJson.set("freeHeap", (unsigned long)ESP.getFreeHeap());

  float chipTemp = 0.0f;
  if (temperatureSensorReady && temp_sensor_read_celsius(&chipTemp) == ESP_OK) {
    writeJson.set("chipTempC", (float)((int)(chipTemp * 10)) / 10.0f);
  }
  // Nested path avoids allocating a second JSON object for the timestamp.
  writeJson.set("serverTimestamp/.sv", "timestamp");

  const time_t now = time(nullptr);
  struct tm timeinfo;
  if (now >= CLOCK_VALID_AFTER && localtime_r(&now, &timeinfo) != nullptr) {
    char lastSeen[32];
    strftime(lastSeen, sizeof(lastSeen), "%d/%m/%Y %H:%M:%S IST", &timeinfo);
    writeJson.set("lastSeen", lastSeen);
    writeJson.set("lastSeenEpoch", (unsigned long)now);
  }

  const bool synced = Firebase.RTDB.updateNodeSilent(&fbdoWrite, FB_PATH_STATUS, &writeJson);
  writeJson.clear();
  if (synced) {
    lastHeartbeat = millis();
    writeRetry.reset();
  } else {
    writeRetry.failed();
    Serial.printf("[Firebase] Heartbeat failed (HTTP %d); retry in %lu ms.\n",
                  fbdoWrite.httpCode(), writeRetry.waitMs);
  }
}

void connectWiFiNonBlocking() {
  WiFi.persistent(false); // Avoid rewriting credentials to flash on every retry.
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setTxPower(WIFI_TX_POWER);
  lastWifiRetry = millis();
  Serial.println(F("[WiFi] Connecting in background (8.5 dBm TX power)."));
}

void handleNetworkHealth() {
  const unsigned long now = millis();
  if (WiFi.status() != WL_CONNECTED) {
    if (isOnlineMode) {
      isOnlineMode = false;
      if (firebaseInitialized) {
        Firebase.RTDB.endStream(&fbdoStream);
        fbdoStream.clear();
        fbdoWrite.clear();
      }
      firebaseStreamActive = false;
      lastWifiRetry = now;
      Serial.println(F("[WiFi] Offline. Local switches remain active."));
    }
    if (now - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS) {
      lastWifiRetry = now;
      WiFi.reconnect(); // No disconnect/begin loop while auto-reconnect is active.
    }
    return;
  }

  if (!isOnlineMode) {
    isOnlineMode = true;
    localIp = WiFi.localIP().toString();
    streamRetry.reset();
    writeRetry.reset();
    lastHeartbeat = now - HEARTBEAT_INTERVAL_MS; // Heartbeat due as soon as ready.
    lastReportHeartbeat = now - HEARTBEAT_INTERVAL_MS;
    Serial.printf("[WiFi] Online: %s\n", localIp.c_str());
    if (!clockStarted) {
      configTime(19800, 0, "pool.ntp.org", "time.google.com", "time.windows.com");
      clockStartedAt = now;
      clockStarted = true;
    }
    initializeOTA(); // OTA remains available even when NTP/Firebase is unreachable.
  }
}

void initializeFirebase() {
  // configTime() syncs asynchronously. Never wait in getLocalTime() at startup.
  if (firebaseInitialized) return;
  if (time(nullptr) < CLOCK_VALID_AFTER) {
    if (!clockStarted || millis() - clockStartedAt < NTP_GRACE_MS) return;
    // Preserve cloud connection attempts when a router blocks NTP. SNTP keeps
    // retrying in the background; serverTimestamp still reports device liveness.
    Serial.println(F("[Firebase] NTP pending; attempting cloud connection."));
  }
  fbConfig.database_url = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_DB_SECRET;
  fbConfig.timeout.wifiReconnect = 5000;
  fbConfig.timeout.socketConnection = 3000;
  fbConfig.timeout.sslHandshake = 6000;
  fbConfig.timeout.serverResponse = 3000; // Previously left at the 10-second default.
  fbConfig.timeout.rtdbKeepAlive = 45000;
  fbConfig.timeout.rtdbStreamReconnect = 5000;

  fbdoStream.setResponseSize(2048);
  fbdoStream.setBSSLBufferSize(2048, 1024);
  fbdoWrite.setResponseSize(1024);
  fbdoWrite.setBSSLBufferSize(2048, 1024);
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(false);
  firebaseInitialized = true;
  Serial.println(F("[Firebase] Client initialized."));
}

void initializeOTA() {
  if (otaInitialized || WiFi.status() != WL_CONNECTED) return;
  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);
  ArduinoOTA.onStart([]() {
    Serial.printf("[OTA] Updating %s...\n",
                  ArduinoOTA.getCommand() == U_FLASH ? "firmware" : "filesystem");
  });
  ArduinoOTA.onEnd([]() { Serial.println(F("[OTA] Complete. Rebooting...")); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    static unsigned int lastPercent = 101;
    const unsigned int percent = total == 0 ? 0 : (unsigned int)((uint64_t)progress * 100 / total);
    if (percent != lastPercent) {
      lastPercent = percent;
      Serial.printf("[OTA] %u%%\r", percent);
    }
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("[OTA] Error %u: %s\n", error,
                  error == OTA_AUTH_ERROR ? "Authentication failed" :
                  error == OTA_BEGIN_ERROR ? "Begin failed" :
                  error == OTA_CONNECT_ERROR ? "Connect failed" :
                  error == OTA_RECEIVE_ERROR ? "Receive failed" : "End failed");
  });
  ArduinoOTA.begin();
  otaInitialized = true;
  Serial.printf("[OTA] Ready: %s\n", OTA_HOSTNAME);
}
