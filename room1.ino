/*
 * ══════════════════════════════════════════════════════════════════════════════════
 *   IoTMesh - Room 1 Hybrid Smart Controller (ESP32-C3 Super Mini)
 * ══════════════════════════════════════════════════════════════════════════════════
 * 
 * Target Board: ESP32-C3 Super Mini
 * 
 * Devices & Hardware Mapping:
 *   - Device 1: Ceiling Light  --> Switch: GPIO 1 | Relay: GPIO 21 | Firebase: "/home/room1/controls/light"
 *   - Device 2: Wall Switch    --> Switch: GPIO 4 | Relay: GPIO 20 | Firebase: "/home/room1/controls/switch"
 *   - Device 3: Ceiling Fan    --> Switch: GPIO 3 | Relay: GPIO 5  | Firebase: "/home/room1/controls/fan" & "fanspeed"
 * 
 * Key Features:
 *   1. 100% Autonomous Offline Operation:
 *      Physical switches control the relays instantly with ZERO lag even if WiFi
 *      is disconnected, router is off, or Firebase is unreachable.
 *   2. Real-Time Cloud Synchronization:
 *      Controls synchronize bidirectionally with Firebase Realtime Database
 *      (`/home/room1/controls`) and the IoTMesh Web Dashboard.
 *   3. Smart Two-Way Switching:
 *      Flipping a physical switch always changes device state, even if previously
 *      toggled from the web or smartphone.
 * ══════════════════════════════════════════════════════════════════════════════════
 */

// =================================================================================
//  1. REQUIRED LIBRARIES
// =================================================================================
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoOTA.h>              // OTA (Over-The-Air) firmware update support

// Token and RTDB helper classes from Mobizt Firebase library
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "driver/temp_sensor.h"     // ESP32-C3 built-in chip temperature sensor
#include "esp_bt.h"                 // Bluetooth control & power management

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
#define FB_PATH_CONTROLS        "/home/room1/controls"
#define FB_PATH_STATUS          "/home/room1/status"

// OTA (Over-The-Air) Update Configuration
#define OTA_HOSTNAME            "IoTMesh-Room1"   // Device name visible in Arduino IDE -> Tools -> Port
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

// =================================================================================
//  4. DATA STRUCTURES & GLOBAL OBJECTS
// =================================================================================
struct Channel {
  const char*   name;
  const char*   firebaseKey;
  uint8_t       switchPin;
  uint8_t       relayPin;
  bool          relayState;          // Current relay state (true = ON, false = OFF)
  bool          pendingSync;         // True if local state changed and needs cloud push
  int           lastReading;         // Immediate digital reading
  int           stableState;         // Debounced stable state
  unsigned long lastDebounceTime;    // Last transition timestamp
};

// Map each device channel
Channel channels[] = {
  { "Ceiling Light", "light",  SWITCH1_PIN, RELAY1_PIN, false, false, SWITCH_INACTIVE_LEVEL, SWITCH_INACTIVE_LEVEL, 0 },
  { "Wall Switch",   "switch", SWITCH2_PIN, RELAY2_PIN, false, false, SWITCH_INACTIVE_LEVEL, SWITCH_INACTIVE_LEVEL, 0 },
  { "Ceiling Fan",   "fan",    SWITCH3_PIN, RELAY3_PIN, false, false, SWITCH_INACTIVE_LEVEL, SWITCH_INACTIVE_LEVEL, 0 }
};

const uint8_t NUM_CHANNELS = sizeof(channels) / sizeof(channels[0]);

// Fan speed state
int currentFanSpeed           = 0;     // Fan speed (0-5) from /home/room1/controls/fanspeed

// Firebase RTDB Client Objects
FirebaseData fbdoStream;
FirebaseData fbdoWrite;
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

bool isOnlineMode            = false;  // True = Connected to WiFi & Cloud; False = Standalone Offline Mode
bool firebaseInitialized     = false;
bool firebaseStreamActive    = false;
bool otaInitialized          = false;  // OTA ready flag
unsigned long lastWifiCheck  = 0;
unsigned long lastWifiRetry  = 0;      // Timestamp of last WiFi reconnect attempt while offline
unsigned int  wifiRetryCount = 0;      // Number of reconnect attempts made while offline
unsigned long lastHeartbeat  = 0;

// Function Prototypes
void applyRelayState(Channel &ch);
void handlePhysicalSwitches();
void toggleRelayFromSwitch(uint8_t index);
void setRelayFromCloud(uint8_t index, bool targetState);
void connectWiFiNonBlocking();
void handleNetworkHealth();
void initializeFirebase();
void setupFirebaseStream();
void syncPendingStatesToFirebase();
void updateFirebaseHeartbeat();
void handleStreamCallback(FirebaseStream data);
void handleStreamTimeoutCallback(bool matched);
void initializeOTA();

// =================================================================================
//  5. SETUP ROUTINE
// =================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println(F("=================================================="));
  Serial.println(F("   IoTMesh Room 1 Controller (ESP32-C3)           "));
  Serial.println(F("   Hybrid Cloud + Offline Switchboard Control     "));
  Serial.println(F("=================================================="));

  // 0. Disable Bluetooth immediately (saves ~10-15mA power, frees RAM, prevents RF brownouts)
  btStop();
#if defined(CONFIG_IDF_TARGET_ESP32C3) || defined(CONFIG_IDF_TARGET_ESP32S3)
  esp_bt_controller_mem_release(ESP_BT_MODE_BLE);
#else
  #if defined(ESP_BT_MODE_BTDM)
    esp_bt_controller_mem_release(ESP_BT_MODE_BTDM);
  #elif defined(ESP_BT_MODE_BLE)
    esp_bt_controller_mem_release(ESP_BT_MODE_BLE);
  #endif
#endif
  Serial.println(F("[Hardware] Bluetooth disabled (RF & power optimization applied)."));

  // 1. Initialize Hardware Pins FIRST (Offline switches immediately operational)
  for (uint8_t i = 0; i < NUM_CHANNELS; i++) {
    pinMode(channels[i].relayPin, OUTPUT);
    channels[i].relayState = false;
    applyRelayState(channels[i]);

    pinMode(channels[i].switchPin, SWITCH_PIN_MODE);

    int initialReading = digitalRead(channels[i].switchPin);
    channels[i].lastReading = initialReading;
    channels[i].stableState = initialReading;
    channels[i].lastDebounceTime = millis();

    #if !SMART_TOGGLE_MODE
      channels[i].relayState = (initialReading == SWITCH_ACTIVE_LEVEL);
      applyRelayState(channels[i]);
    #endif

    Serial.printf("[Hardware] %s configured: Switch Pin %d -> Relay Pin %d\n",
                  channels[i].name, channels[i].switchPin, channels[i].relayPin);
  }

  Serial.println(F("[System] Hardware Ready. Local switches operational."));

  // 1b. Initialize built-in chip temperature sensor
  temp_sensor_config_t tempConfig = TSENS_CONFIG_DEFAULT();
  temp_sensor_set_config(tempConfig);
  temp_sensor_start();
  Serial.println(F("[Hardware] Chip temperature sensor initialized."));

  // 2. Connect WiFi (12-second attempt with active switches)
  connectWiFiNonBlocking();

  // 3. If connected at boot, initialize Firebase + OTA
  if (WiFi.status() == WL_CONNECTED) {
    isOnlineMode = true;
    Serial.println(F("[System] Mode: ONLINE (Cloud Connected)"));
    initializeFirebase();
    initializeOTA();
  } else {
    isOnlineMode = false;
    lastWifiRetry = millis();
    Serial.println();
    Serial.println(F("══════════════════════════════════════════════════"));
    Serial.println(F("[System] Mode: OFFLINE (Autonomous Local Switchboard)"));
    Serial.println(F("[System] Physical switches are 100% active with ZERO lag."));
    Serial.printf("[System] Retrying WiFi every %lu seconds in background...\n", WIFI_RETRY_INTERVAL_MS / 1000);
    Serial.println(F("══════════════════════════════════════════════════"));
  }
}

// =================================================================================
//  6. MAIN EXECUTION LOOP (ZERO BLOCKING)
// =================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // ── Step 0: OTA update handler (runs only when online & initialized) ──
  if (isOnlineMode && otaInitialized) {
    ArduinoOTA.handle();
  }

  // ── Step 1: ALWAYS handle physical switches (runs continuously with zero lag) ──
  handlePhysicalSwitches();

  // ── Step 2: WiFi Health & Mode Transition Manager ──
  if (currentMillis - lastWifiCheck >= WIFI_CHECK_INTERVAL_MS) {
    lastWifiCheck = currentMillis;
    handleNetworkHealth();
  }

  // ── Step 3: Cloud Operations (Executed ONLY when in Online Mode) ──
  if (isOnlineMode && WiFi.status() == WL_CONNECTED) {
    // If connected later via background reconnect, ensure Firebase is initialized
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    // Once Firebase security token is authenticated
    if (Firebase.ready()) {
      // 3A: Start stream if not yet active
      if (!firebaseStreamActive) {
        setupFirebaseStream();
      }

      // 3B: Process incoming stream events (Essential for ESP32-C3 real-time execution)
      if (firebaseStreamActive) {
        if (!Firebase.RTDB.readStream(&fbdoStream)) {
          if (fbdoStream.httpCode() != 0) {
            Serial.printf("[Firebase Stream] Read dropped: %s (HTTP %d)\n",
                          fbdoStream.errorReason().c_str(), fbdoStream.httpCode());
            firebaseStreamActive = false;
          }
        }
      }

      // 3C: Synchronize any pending physical switch toggles to Firebase RTDB
      syncPendingStatesToFirebase();

      // 3D: Send Online Status Heartbeat every 15 seconds
      if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeat = currentMillis;
        updateFirebaseHeartbeat();
      }
    }
  }

  // Yield to RTOS background tasks
  yield();
}

// =================================================================================
//  7. PHYSICAL SWITCH DEBOUNCING & RELAY CONTROL
// =================================================================================
void handlePhysicalSwitches() {
  unsigned long currentMillis = millis();

  for (uint8_t i = 0; i < NUM_CHANNELS; i++) {
    int reading = digitalRead(channels[i].switchPin);

    // If signal changed (contact bounce or flip), reset debounce timer
    if (reading != channels[i].lastReading) {
      channels[i].lastDebounceTime = currentMillis;
    }

    // After debounce delay, verify if the stable state genuinely flipped
    if ((currentMillis - channels[i].lastDebounceTime) > DEBOUNCE_DELAY_MS) {
      if (reading != channels[i].stableState) {
        channels[i].stableState = reading;
        toggleRelayFromSwitch(i);
      }
    }

    channels[i].lastReading = reading;
  }
}

void toggleRelayFromSwitch(uint8_t index) {
  #if SMART_TOGGLE_MODE
    // In Smart Toggle Mode, any physical flip of the switch toggles the device
    channels[index].relayState = !channels[index].relayState;
  #else
    // In Direct Follow Mode, relay matches switch position (3.3V = ON, LOW = OFF)
    channels[index].relayState = (channels[index].stableState == SWITCH_ACTIVE_LEVEL);
  #endif

  applyRelayState(channels[index]);
  channels[index].pendingSync = true; // Queue sync to Firebase

  Serial.printf("[Physical Switch] %s toggled -> State: %s\n",
                channels[index].name, channels[index].relayState ? "ON" : "OFF");
}

void applyRelayState(Channel &ch) {
  uint8_t pinLevel = ch.relayState ? RELAY_ON : RELAY_OFF;
  digitalWrite(ch.relayPin, pinLevel);
  Serial.printf("[Relay Action] %s (GPIO %d) -> Output %s | State is %s\n",
                ch.name, ch.relayPin, (pinLevel == HIGH) ? "HIGH" : "LOW", ch.relayState ? "ON" : "OFF");
}

// =================================================================================
//  8. CLOUD (FIREBASE) TO RELAY CONTROL
// =================================================================================
void setRelayFromCloud(uint8_t index, bool targetState) {
  if (index >= NUM_CHANNELS) return;

  // IMPORTANT: If this channel was just toggled locally and is waiting to sync to cloud,
  // do NOT let an echoed or delayed cloud message revert the user's physical toggle!
  if (channels[index].pendingSync) {
    Serial.printf("[Cloud Command] Ignored for %s: local physical switch sync pending\n", channels[index].name);
    return;
  }

  // If the relay is already in the requested state, avoid redundant actions
  if (channels[index].relayState == targetState) return;

  Serial.printf("[Cloud Command] Channel %d (%s) -> Target: %s (Was: %s)\n",
                index, channels[index].name, targetState ? "ON" : "OFF", channels[index].relayState ? "ON" : "OFF");

  channels[index].relayState = targetState;
  applyRelayState(channels[index]);
}

// =================================================================================
//  9. RELAY STATE TO CLOUD SYNCHRONIZATION
// =================================================================================
void syncPendingStatesToFirebase() {
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;

  for (uint8_t i = 0; i < NUM_CHANNELS; i++) {
    if (channels[i].pendingSync) {
      bool success = false;

      // Special handling for Fan (Channel index 2):
      // Update both 'fan' state and 'fanspeed' in a SINGLE atomic Firebase update!
      // This prevents double HTTPS round-trips and eliminates the race condition where
      // fanspeed=0 echoed back and forced the fan relay back OFF.
      if (i == 2) {
        FirebaseJson fanJson;
        fanJson.set("fan", channels[2].relayState);
        int speedToSync = channels[2].relayState ? (currentFanSpeed > 0 ? currentFanSpeed : 3) : 0;
        currentFanSpeed = speedToSync;
        fanJson.set("fanspeed", speedToSync);

        if (Firebase.RTDB.updateNode(&fbdoWrite, FB_PATH_CONTROLS, &fanJson)) {
          success = true;
        } else {
          Serial.printf("[Relay -> Firebase] ❌ Fan sync failed: %s (HTTP %d)\n",
                        fbdoWrite.errorReason().c_str(), fbdoWrite.httpCode());
        }
      } else {
        // Light (0) or Wall Switch (1): Direct boolean set
        String fullPath = String(FB_PATH_CONTROLS) + "/" + channels[i].firebaseKey;
        if (Firebase.RTDB.setBool(&fbdoWrite, fullPath, channels[i].relayState)) {
          success = true;
        } else {
          Serial.printf("[Relay -> Firebase] ❌ %s sync failed: %s (HTTP %d)\n",
                        channels[i].firebaseKey, fbdoWrite.errorReason().c_str(), fbdoWrite.httpCode());
        }
      }

      if (success) {
        channels[i].pendingSync = false;
        Serial.printf("[Relay -> Firebase] ✅ %s synced to RTDB: %s\n",
                      channels[i].firebaseKey, channels[i].relayState ? "true" : "false");
      }
    }
  }
}

// =================================================================================
//  10. FIREBASE REAL-TIME STREAM LISTENER
// =================================================================================
void setupFirebaseStream() {
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;

  Serial.printf("[Firebase] Starting Real-time Stream on: %s ...\n", FB_PATH_CONTROLS);

  if (!Firebase.RTDB.beginStream(&fbdoStream, FB_PATH_CONTROLS)) {
    Serial.printf("[Firebase] ❌ Stream start failed: %s (HTTP %d)\n",
                  fbdoStream.errorReason().c_str(), fbdoStream.httpCode());
    firebaseStreamActive = false;
    return;
  }

  Firebase.RTDB.setStreamCallback(&fbdoStream, handleStreamCallback, handleStreamTimeoutCallback);
  firebaseStreamActive = true;
  Serial.println(F("[Firebase] ✅ Stream active. Listening for website commands..."));
}

void handleStreamCallback(FirebaseStream data) {
  Serial.println();
  Serial.println(F("──────────────────────────────────────────────────"));
  Serial.printf("[Firebase Stream Event] Path: %s | Type: %s | Value: %s\n",
                data.dataPath().c_str(), data.dataType().c_str(), data.stringData().c_str());

  String path = data.dataPath();
  String dataType = data.dataType();

  // Case A: Root JSON received (on initial stream connection or multi-device update)
  if (dataType == "json" || path == "/") {
    FirebaseJson *json = data.to<FirebaseJson *>();
    if (json != nullptr) {
      FirebaseJsonData jsonData;

      if (json->get(jsonData, "light")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        setRelayFromCloud(0, val);
      }
      if (json->get(jsonData, "switch")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        setRelayFromCloud(1, val);
      }
      if (json->get(jsonData, "fan")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        setRelayFromCloud(2, val);
      }
      if (json->get(jsonData, "fanspeed")) {
        int newSpeed = jsonData.intValue;
        Serial.printf("[Cloud Command] Fan Speed -> %d\n", newSpeed);
        currentFanSpeed = newSpeed;
        if (!channels[2].pendingSync) {
          if (newSpeed == 0 && channels[2].relayState) {
            setRelayFromCloud(2, false);
          } else if (newSpeed > 0 && !channels[2].relayState) {
            setRelayFromCloud(2, true);
          }
        }
      }
    }
  }
  // Case B: Individual child node updated from Web Dashboard (/light, /switch, /fan, /fanspeed)
  else {
    bool val = (dataType == "boolean") ? data.boolData() : (data.intData() == 1 || data.stringData() == "true");

    if (path == "/light" || path == "light") {
      setRelayFromCloud(0, val);
    } else if (path == "/switch" || path == "switch") {
      setRelayFromCloud(1, val);
    } else if (path == "/fan" || path == "fan") {
      setRelayFromCloud(2, val);
      if (!val) {
        currentFanSpeed = 0;
      }
    } else if (path == "/fanspeed" || path == "fanspeed") {
      int newSpeed = (dataType == "integer" || dataType == "int") ? data.intData() : atoi(data.stringData().c_str());
      Serial.printf("[Cloud Command] Fan Speed -> %d\n", newSpeed);
      currentFanSpeed = newSpeed;
      if (!channels[2].pendingSync) {
        if (newSpeed == 0 && channels[2].relayState) {
          setRelayFromCloud(2, false);
        } else if (newSpeed > 0 && !channels[2].relayState) {
          setRelayFromCloud(2, true);
        }
      }
    }
  }
  Serial.println(F("──────────────────────────────────────────────────"));
}

void handleStreamTimeoutCallback(bool matched) {
  if (matched) {
    Serial.println(F("[Firebase Stream] Stream timeout detected. Will auto-resume."));
    firebaseStreamActive = false;
  }
}

// =================================================================================
//  11. STATUS HEARTBEAT
// =================================================================================
void updateFirebaseHeartbeat() {
  FirebaseJson jsonStatus;
  jsonStatus.set("online", true);
  jsonStatus.set("ip", WiFi.localIP().toString());
  jsonStatus.set("rssi", WiFi.RSSI());
  jsonStatus.set("uptime", (int)(millis() / 1000));
  jsonStatus.set("freeHeap", (int)ESP.getFreeHeap());

  // Chip temperature from ESP32-C3 internal sensor
  // Note: Reads ~10-15°C above ambient — this is the chip temp, not room temp.
  float chipTemp = 0.0;
  temp_sensor_read_celsius(&chipTemp);
  jsonStatus.set("chipTempC", (float)((int)(chipTemp * 10)) / 10.0); // 1 decimal place

  // Firebase RTDB Server Timestamp (guaranteed to update every heartbeat on Google servers!)
  FirebaseJson sv;
  sv.set(".sv", "timestamp");
  jsonStatus.set("serverTimestamp", sv);

  // Last Seen timestamp — formatted using NTP-synced IST clock
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 100)) {
    char lastSeen[32];
    strftime(lastSeen, sizeof(lastSeen), "%d/%m/%Y %H:%M:%S IST", &timeinfo);
    jsonStatus.set("lastSeen", lastSeen);  // e.g. "16/09/2026 17:44:33 IST"
    time_t nowSec = time(nullptr);
    jsonStatus.set("lastSeenEpoch", (unsigned long)nowSec);
  }

  if (Firebase.RTDB.updateNode(&fbdoWrite, FB_PATH_STATUS, &jsonStatus)) {
    Serial.println(F("[Heartbeat] ✅ Status pushed to Firebase."));
  } else {
    Serial.printf("[Heartbeat] ❌ Failed: %s\n", fbdoWrite.errorReason().c_str());
  }
}

// =================================================================================
//  12. NETWORK CONNECTION & MANAGEMENT
// =================================================================================
void connectWiFiNonBlocking() {
  Serial.printf("[WiFi] Connecting to SSID: '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);

  // Set Wi-Fi TX Power to 8.5 dBm to eliminate ESP32-C3 Super Mini RF brownouts
  WiFi.setTxPower(WIFI_TX_POWER);
  Serial.println(F("[WiFi] TX Power set to 8.5 dBm (stability & brownout prevention)."));

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();

  // Wait up to 12 seconds for router negotiation, but keep physical switches active!
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < 12000)) {
    delay(200);
    Serial.print(".");
    handlePhysicalSwitches(); // Physical switches respond instantly even during boot connection!
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("[WiFi] ✅ Connected successfully!"));
    Serial.printf("[WiFi] IP Assigned: %s | Signal: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.printf("[WiFi] ⚠️ Not connected yet (Status code: %d). Continuing in background.\n", WiFi.status());
  }
}

void handleNetworkHealth() {
  unsigned long currentMillis = millis();
  bool wifiConnected = (WiFi.status() == WL_CONNECTED);

  // ══════════════════════════════════════════════════════════════════
  //  CASE 1: WAS ONLINE -> NOW DISCONNECTED (Router off / signal lost)
  // ══════════════════════════════════════════════════════════════════
  if (isOnlineMode && !wifiConnected) {
    isOnlineMode = false;
    firebaseStreamActive = false;
    wifiRetryCount = 0;
    lastWifiRetry = currentMillis; // Start retry timer from now

    // Cleanly close stream to release socket and prevent hanging Firebase calls
    fbdoStream.clear();

    Serial.println();
    Serial.println(F("══════════════════════════════════════════════════════════"));
    Serial.println(F("[Network] ⚠️  WiFi connection lost / router disconnected!"));
    Serial.println(F("[System]  Switching to Autonomous OFFLINE MODE."));
    Serial.println(F("[System]  Physical switches remain 100% operational with ZERO lag."));
    Serial.printf("[System]  Will retry WiFi connection every %lu seconds in background.\n", WIFI_RETRY_INTERVAL_MS / 1000);
    Serial.println(F("══════════════════════════════════════════════════════════"));
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  //  CASE 2: IN OFFLINE MODE -> PERIODIC BACKGROUND RETRY
  // ══════════════════════════════════════════════════════════════════
  if (!isOnlineMode) {
    if (!wifiConnected) {
      if (currentMillis - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS) {
        lastWifiRetry = currentMillis;
        wifiRetryCount++;
        Serial.println();
        Serial.printf("[Offline Mode] Retrying WiFi connection to '%s' (Attempt #%u in background)...\n",
                      WIFI_SSID, wifiRetryCount);

        // Completely non-blocking reconnect initiation
        WiFi.disconnect();
        WiFi.setTxPower(WIFI_TX_POWER);
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════════════
    //  CASE 3: WAS OFFLINE -> WIFI RECONNECTED!
    // ══════════════════════════════════════════════════════════════════
    isOnlineMode = true;
    wifiRetryCount = 0;

    Serial.println();
    Serial.println(F("══════════════════════════════════════════════════════════"));
    Serial.println(F("[Network] ✅ WiFi Reconnected successfully!"));
    Serial.printf("[Network] IP Assigned: %s | Signal: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    Serial.println(F("[System]  Switching from OFFLINE MODE -> ONLINE MODE."));
    Serial.println(F("[System]  Resuming Firebase synchronization and cloud services..."));
    Serial.println(F("══════════════════════════════════════════════════════════"));

    if (!firebaseInitialized) {
      initializeFirebase();
    } else {
      // Re-arm stream so it cleanly reconnects to Firebase RTDB
      firebaseStreamActive = false;
      setupFirebaseStream();
    }

    if (!otaInitialized) {
      initializeOTA();
    }

    // Force an immediate heartbeat push now that we are online
    lastHeartbeat = currentMillis;
    updateFirebaseHeartbeat();

    // Immediately push any local switch states that were changed while offline
    syncPendingStatesToFirebase();
  }
}

// =================================================================================
//  13. FIREBASE CLIENT INITIALIZATION
// =================================================================================
void initializeFirebase() {
  if (firebaseInitialized) return;

  Serial.println(F("[Firebase] Initializing client..."));

  // ── NTP Time Sync (CRITICAL for SSL on ESP32-C3) ──────────────────────────
  // ESP32-C3 boots with time = Jan 1 1970. Firebase SSL certificates appear
  // "expired" to the chip, causing: "ERROR.mConnectSSL: Failed to initialize
  // the SSL layer". NTP sync fixes this before any SSL connection is made.
  // IST = UTC + 5h 30m = 19800 seconds offset
  static bool ntpSynced = false;
  if (!ntpSynced) {
    configTime(19800, 0, "pool.ntp.org", "time.google.com", "time.windows.com");
    Serial.print(F("[Firebase] Syncing time via NTP (IST)..."));
    struct tm timeinfo;
    unsigned long ntpStart = millis();
    while (!getLocalTime(&timeinfo) && (millis() - ntpStart < 8000)) {
      delay(500);
      Serial.print(".");
      handlePhysicalSwitches(); // Keep switches responsive during NTP sync
    }
    Serial.println();
    if (getLocalTime(&timeinfo)) {
      ntpSynced = true;
      Serial.printf("[Firebase] ✅ Time synced: %02d:%02d:%02d IST\n",
                    timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    } else {
      Serial.println(F("[Firebase] ⚠️  NTP sync timed out — SSL errors may occur. Check internet access."));
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  fbConfig.database_url = FIREBASE_HOST;                      // Correct field (host is deprecated)
  fbConfig.signer.tokens.legacy_token = FIREBASE_DB_SECRET;  // Legacy Database Secret for auth

  // Robust connection timeouts (optimized for fast response without long freezes)
  fbConfig.timeout.wifiReconnect    = 5000;
  fbConfig.timeout.socketConnection = 5000;  // 5s: prevents freezing the loop if socket stalls
  fbConfig.timeout.sslHandshake     = 6000;  // 6s: fast recovery
  fbConfig.timeout.rtdbKeepAlive    = 45000;
  fbConfig.timeout.rtdbStreamReconnect = 5000;

  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(false); // Managed by handleNetworkHealth(); do NOT let library block switch operations

  // ── Memory-efficient SSL buffers (Optimized for ESP32-C3) ──
  // 2048 RX buffer ensures Google Firebase HTTPS headers & TLS frames don't overflow,
  // preventing dropped writes and 10-15s timeouts.
  fbdoStream.setResponseSize(2048);          // Stream: receives JSON payloads
  fbdoStream.setBSSLBufferSize(2048, 1024);  // Stream SSL: 3KB total

  fbdoWrite.setResponseSize(1024);           // Write: small ACK responses only
  fbdoWrite.setBSSLBufferSize(2048, 1024);  // Write SSL: 3KB total (prevents buffer overflow)

  firebaseInitialized = true;
  Serial.println(F("[Firebase] Client initialized. Waiting for authentication ready..."));
}

// =================================================================================
//  14. OTA (OVER-THE-AIR) UPDATE
// =================================================================================
void initializeOTA() {
  if (otaInitialized) return;
  if (WiFi.status() != WL_CONNECTED) return;

  ArduinoOTA.setHostname(OTA_HOSTNAME);
  ArduinoOTA.setPassword(OTA_PASSWORD);

  ArduinoOTA.onStart([]() {
    String type = (ArduinoOTA.getCommand() == U_FLASH) ? "firmware" : "filesystem";
    Serial.println("\n[OTA] ⬆️  Update started: " + type);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println(F("\n[OTA] ✅ Update complete! Rebooting..."));
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("[OTA] Progress: %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("\n[OTA] ❌ Error [%u]: ", error);
    if      (error == OTA_AUTH_ERROR)    Serial.println(F("Authentication failed — check OTA_PASSWORD"));
    else if (error == OTA_BEGIN_ERROR)   Serial.println(F("Begin failed"));
    else if (error == OTA_CONNECT_ERROR) Serial.println(F("Connect failed"));
    else if (error == OTA_RECEIVE_ERROR) Serial.println(F("Receive failed"));
    else if (error == OTA_END_ERROR)     Serial.println(F("End failed"));
  });

  ArduinoOTA.begin();
  otaInitialized = true;
  Serial.printf("[OTA] ✅ Ready! Hostname: '%s' | Upload via Arduino IDE -> Tools -> Port\n", OTA_HOSTNAME);
}
