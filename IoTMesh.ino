/*
 * ══════════════════════════════════════════════════════════════════════════════════
 *   IoTMesh - Common Area Smart Controller (ESP32 WROOM/DevKit)
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * Target Board: ESP32 (Standard WROOM / DevKit V1)
 *
 * Hardware Architecture:
 *   ESP32 ──[I²C]──► PCF8574 (GPIO Expander, 0x20) ──► ULN2003APG ──► 6 Relays
 *   ESP32 ──[I²C]──► BMP180 (Pressure + Temp Sensor, 0x77)
 *   ESP32 ──[GPIO]──► DHT11 (Temperature + Humidity)
 *   ESP32 ──[ADC]──► MQ135 (Air Quality / Gas Sensor)
 *
 * I²C Bus: SDA = GPIO 4, SCL = GPIO 5 (shared by PCF8574 + BMP180)
 *
 * PCF8574 Pin → ULN2003APG → Relay Mapping:
 *   P0 = Fan Speed LOW     ┐
 *   P1 = Fan Speed MEDIUM  ├─ Mutually exclusive: only ONE active when fan=ON
 *   P2 = Fan Speed HIGH    ┘  All THREE OFF when fan=OFF
 *   P3 = Refrigerator      ─── Independent ON/OFF
 *   P4 = Light             ─── Independent ON/OFF
 *   P5 = TV / General Switch── Independent ON/OFF
 *   P6 = (Unused)
 *   P7 = (Unused)
 *
 * Sensor Connections:
 *   DHT11  → Data Pin: GPIO 15
 *   MQ135  → Analog Pin: GPIO 34 (ADC1_CH6)
 *   BMP180 → I²C Bus (SDA=4, SCL=5), Address 0x77
 *
 * Firebase RTDB Paths:
 *   /home/commonarea/controls  → {fan, fanspeed, light, refrigerator, tv}
 *   /home/commonarea/status    → {online, ip, rssi, uptime, chipTempC, ...}
 *   /home/sensor               → {temperature, humidity, gas, pressure, temperatureBMP, ...}
 *   /home/history              → Timestamped sensor snapshots
 *
 * Timing:
 *   - Status heartbeat:   every 1 second
 *   - Sensor read + push: every 15 seconds
 *   - History log:        every 1 minute (key = minute-of-day 0-1439)
 *
 * ══════════════════════════════════════════════════════════════════════════════════
 */

// =================================================================================
//  1. REQUIRED LIBRARIES
// =================================================================================
#include <WiFi.h>
#include <Wire.h>                    // I²C for PCF8574 + BMP180
#include <Firebase_ESP_Client.h>
#include <ArduinoOTA.h>              // OTA (Over-The-Air) firmware update support
#include <DHT.h>                     // DHT11 temperature & humidity sensor
#include <Adafruit_BMP085.h>         // BMP180 pressure sensor (uses BMP085 library)

// Token and RTDB helper classes from Mobizt Firebase library
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// =================================================================================
//  2. NETWORK & FIREBASE CONFIGURATION
// =================================================================================
#define WIFI_SSID               "BAJPAI_2.4Ghz"               // Your WiFi Network SSID
#define WIFI_PASSWORD           "44444422"                     // Your WiFi Password

// Firebase Project Credentials
#define FIREBASE_HOST           "https://iotmesh-4123-default-rtdb.firebaseio.com/"
#define FIREBASE_DB_SECRET      "ItjOcSIaW6GRLAnZLhIi1ouEFFwfCYiQR5cqsmwi"

// Realtime Database Paths
#define FB_PATH_CONTROLS        "/home/commonarea/controls"
#define FB_PATH_STATUS          "/home/commonarea/status"
#define FB_PATH_SENSOR          "/home/sensor"
#define FB_PATH_HISTORY         "/home/history"

// OTA (Over-The-Air) Update Configuration
#define OTA_HOSTNAME            "IoTMesh-CommonArea"
#define OTA_PASSWORD            "commonota123"

// =================================================================================
//  3. PIN DEFINITIONS & HARDWARE CONFIGURATION
// =================================================================================

// I²C Bus Pins (shared by PCF8574 + BMP180)
#define I2C_SDA                 4
#define I2C_SCL                 5

// PCF8574 I²C Address (A0=A1=A2=GND)
#define PCF8574_ADDRESS         0x20

// PCF8574 Output Pin Assignments (directly wired to ULN2003APG inputs)
#define PCF_FAN_LOW             0    // P0 → ULN2003 IN1 → Relay 1 (Fan Low Speed)
#define PCF_FAN_MED             1    // P1 → ULN2003 IN2 → Relay 2 (Fan Medium Speed)
#define PCF_FAN_HIGH            2    // P2 → ULN2003 IN3 → Relay 3 (Fan High Speed)
#define PCF_REFRIGERATOR        3    // P3 → ULN2003 IN4 → Relay 4 (Refrigerator)
#define PCF_LIGHT               4    // P4 → ULN2003 IN5 → Relay 5 (Light)
#define PCF_TV                  5    // P5 → ULN2003 IN6 → Relay 6 (TV / General Switch)

// Sensor Pins
#define DHT_PIN                 15   // DHT11 Data Pin (GPIO 15)
#define DHT_TYPE                DHT11
#define MQ135_PIN               34   // MQ135 Analog Output (ADC1_CH6, GPIO 34)

// =================================================================================
//  4. TIMING CONSTANTS
// =================================================================================
const unsigned long WIFI_CHECK_INTERVAL_MS   = 5000;   // Check WiFi health every 5s
const unsigned long WIFI_RETRY_INTERVAL_MS   = 20000;  // When offline, retry WiFi every 20s
const unsigned long HEARTBEAT_INTERVAL_MS    = 1000;   // Push status heartbeat every 1 second
const unsigned long SENSOR_READ_INTERVAL_MS  = 15000;  // Read sensors every 15 seconds
const unsigned long HISTORY_LOG_INTERVAL_MS  = 60000;  // Log history every 1 minute

// =================================================================================
//  5. GLOBAL OBJECTS & STATE VARIABLES
// =================================================================================

// Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP085 bmp;

// Firebase RTDB Client Objects
FirebaseData fbdoStream;
FirebaseData fbdoWrite;
FirebaseData fbdoSensor;             // Dedicated FirebaseData for sensor/history writes
FirebaseAuth fbAuth;
FirebaseConfig fbConfig;

// ── Control States (synced with Firebase) ──
bool controlFan         = false;     // Fan master ON/OFF
int  controlFanSpeed    = 1;         // Fan speed: 1=Low, 2=Medium, 3=High
bool controlLight       = false;     // Light ON/OFF
bool controlRefrigerator = false;    // Refrigerator ON/OFF
bool controlTV          = false;     // TV / General Switch ON/OFF

// ── PCF8574 Output Register ──
// PCF8574 uses inverted logic: writing LOW (0) activates the ULN2003 input
// because ULN2003 is an NPN darlington array (active HIGH input).
// However, PCF8574 outputs are quasi-bidirectional:
//   - Writing 1 to a pin = pin goes HIGH (output is weakly pulled up)
//   - Writing 0 to a pin = pin sinks current → drives ULN2003 input HIGH
// Since ULN2003APG inputs are active HIGH and PCF8574 drives them:
//   - To ACTIVATE relay: Write HIGH (1) on PCF8574 pin → ULN2003 input goes HIGH → relay ON
//   - To DEACTIVATE relay: Write LOW (0) → ULN2003 input goes LOW → relay OFF
// NOTE: If your relays work inverted, flip RELAY_ACTIVE_LEVEL below.
#define PCF_RELAY_ON            1    // HIGH = Relay activated via ULN2003
#define PCF_RELAY_OFF           0    // LOW  = Relay deactivated

uint8_t pcf8574OutputState = 0x00;   // All relays OFF at startup

// ── Sensor Data (latest readings) ──
float sensorTemperature    = 0.0;    // DHT11 temperature (°C)
float sensorHumidity       = 0.0;    // DHT11 humidity (%)
int   sensorGasRaw         = 0;      // MQ135 raw ADC value
float sensorPressure       = 0.0;    // BMP180 pressure (hPa)
float sensorTempBMP        = 0.0;    // BMP180 temperature (°C)
bool  sensorBMPAvailable   = false;  // BMP180 initialized successfully

// ── System State Flags ──
bool isOnlineMode            = false;
bool firebaseInitialized     = false;
bool firebaseStreamActive    = false;
bool otaInitialized          = false;
unsigned long lastWifiCheck  = 0;
unsigned long lastWifiRetry  = 0;
unsigned int  wifiRetryCount = 0;
unsigned long lastHeartbeat  = 0;
unsigned long lastSensorRead = 0;
unsigned long lastHistoryLog = 0;
unsigned long bootTime       = 0;

// Function Prototypes
void pcf8574Write(uint8_t state);
void updateRelaysFromState();
void readAllSensors();
void pushSensorDataToFirebase();
void pushHistoryToFirebase();
void connectWiFiNonBlocking();
void handleNetworkHealth();
void initializeFirebase();
void setupFirebaseStream();
void updateFirebaseHeartbeat();
void handleStreamCallback(FirebaseStream data);
void handleStreamTimeoutCallback(bool matched);
void initializeOTA();

// =================================================================================
//  6. PCF8574 I²C GPIO EXPANDER DRIVER
// =================================================================================

/**
 * Write a full 8-bit state to the PCF8574.
 * Each bit corresponds to P0-P7. 
 * Bit = 1 → Output HIGH (ULN2003 input HIGH → relay activates)
 * Bit = 0 → Output LOW  (ULN2003 input LOW  → relay deactivates)
 */
void pcf8574Write(uint8_t state) {
  Wire.beginTransmission(PCF8574_ADDRESS);
  Wire.write(state);
  uint8_t error = Wire.endTransmission();
  
  if (error != 0) {
    Serial.printf("[PCF8574] ❌ I²C write error: %d (Address: 0x%02X)\n", error, PCF8574_ADDRESS);
  } else {
    pcf8574OutputState = state;
  }
}

/**
 * Read current state from PCF8574 (for verification).
 */
uint8_t pcf8574Read() {
  Wire.requestFrom((uint8_t)PCF8574_ADDRESS, (uint8_t)1);
  if (Wire.available()) {
    return Wire.read();
  }
  return 0xFF; // Error
}

/**
 * Set or clear a single bit in the PCF8574 output register, then write.
 */
void pcf8574SetPin(uint8_t pin, bool active) {
  if (pin > 7) return;
  
  if (active) {
    pcf8574OutputState |= (1 << pin);   // Set bit HIGH (relay ON)
  } else {
    pcf8574OutputState &= ~(1 << pin);  // Set bit LOW (relay OFF)
  }
  pcf8574Write(pcf8574OutputState);
}

// =================================================================================
//  7. RELAY CONTROL LOGIC
// =================================================================================

/**
 * Update all 6 relays based on current control states.
 * Fan relays are mutually exclusive — only one speed relay is active at a time.
 * When fan is OFF, all 3 fan relays are OFF.
 */
void updateRelaysFromState() {
  uint8_t newState = 0x00;
  
  // ── Fan Speed Relays (mutually exclusive) ──
  if (controlFan) {
    switch (controlFanSpeed) {
      case 1:  // Low speed
        newState |= (PCF_RELAY_ON << PCF_FAN_LOW);
        break;
      case 2:  // Medium speed
        newState |= (PCF_RELAY_ON << PCF_FAN_MED);
        break;
      case 3:  // High speed
        newState |= (PCF_RELAY_ON << PCF_FAN_HIGH);
        break;
      default: // Invalid speed → default to Low
        newState |= (PCF_RELAY_ON << PCF_FAN_LOW);
        controlFanSpeed = 1;
        break;
    }
  }
  // If fan is OFF: no fan speed bits are set → all 3 fan relays remain OFF
  
  // ── Independent Device Relays ──
  if (controlRefrigerator) {
    newState |= (PCF_RELAY_ON << PCF_REFRIGERATOR);
  }
  if (controlLight) {
    newState |= (PCF_RELAY_ON << PCF_LIGHT);
  }
  if (controlTV) {
    newState |= (PCF_RELAY_ON << PCF_TV);
  }
  
  // Only write to I²C if state actually changed (reduces bus traffic)
  if (newState != pcf8574OutputState) {
    Serial.printf("[Relay] State change: 0x%02X → 0x%02X | Fan:%s(Spd:%d) Fridge:%s Light:%s TV:%s\n",
                  pcf8574OutputState, newState,
                  controlFan ? "ON" : "OFF", controlFanSpeed,
                  controlRefrigerator ? "ON" : "OFF",
                  controlLight ? "ON" : "OFF",
                  controlTV ? "ON" : "OFF");
    pcf8574Write(newState);
  }
}

// =================================================================================
//  8. SENSOR READING
// =================================================================================

/**
 * Read all sensors: DHT11, MQ135, BMP180.
 * Updates global sensor variables.
 */
void readAllSensors() {
  // ── DHT11: Temperature & Humidity ──
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (!isnan(h) && !isnan(t)) {
    sensorHumidity = h;
    sensorTemperature = t;
    Serial.printf("[DHT11] Temp: %.1f°C | Humidity: %.1f%%\n", t, h);
  } else {
    Serial.println("[DHT11] ⚠️ Read failed — check wiring or pull-up resistor!");
  }
  
  // ── MQ135: Gas / Air Quality (Raw ADC) ──
  sensorGasRaw = analogRead(MQ135_PIN);
  Serial.printf("[MQ135] Gas Raw ADC: %d\n", sensorGasRaw);
  
  // ── BMP180: Pressure & Temperature ──
  if (sensorBMPAvailable) {
    sensorTempBMP = bmp.readTemperature();
    sensorPressure = bmp.readPressure() / 100.0;  // Convert Pa → hPa (mbar)
    Serial.printf("[BMP180] Temp: %.1f°C | Pressure: %.1f hPa\n", sensorTempBMP, sensorPressure);
  } else {
    Serial.println("[BMP180] ⚠️ Sensor not available — skipping read.");
  }
}

// =================================================================================
//  9. FIREBASE SENSOR & HISTORY PUSH
// =================================================================================

/**
 * Push latest sensor readings to /home/sensor in Firebase RTDB.
 */
void pushSensorDataToFirebase() {
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;
  
  FirebaseJson sensorJson;
  sensorJson.set("temperature", (float)((int)(sensorTemperature * 10)) / 10.0);
  sensorJson.set("humidity", (float)((int)(sensorHumidity * 10)) / 10.0);
  sensorJson.set("gas", sensorGasRaw);
  sensorJson.set("pressure", (float)((int)(sensorPressure * 10)) / 10.0);
  sensorJson.set("temperatureBMP", (float)((int)(sensorTempBMP * 10)) / 10.0);
  
  // Power indicator (1 = ESP32 powered on)
  sensorJson.set("power", 1);
  
  // Timestamp
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 100)) {
    char lastUpdate[32];
    strftime(lastUpdate, sizeof(lastUpdate), "%d/%m/%Y %H:%M:%S", &timeinfo);
    sensorJson.set("last_update", lastUpdate);
    
    // Epoch timestamp in milliseconds
    time_t nowSec = time(nullptr);
    sensorJson.set("timestamp", (unsigned long)(nowSec) * 1000UL);
  }
  
  // Firebase Server Timestamp
  FirebaseJson sv;
  sv.set(".sv", "timestamp");
  sensorJson.set("serverTimestamp", sv);
  
  if (Firebase.RTDB.updateNode(&fbdoSensor, FB_PATH_SENSOR, &sensorJson)) {
    Serial.println("[Sensor → Firebase] ✅ Sensor data pushed.");
  } else {
    Serial.printf("[Sensor → Firebase] ❌ Failed: %s\n", fbdoSensor.errorReason().c_str());
  }
}

/**
 * Push a sensor snapshot to /home/history/{minuteOfDay} in Firebase.
 * Key = (hour * 60) + minute  →  e.g. 1:32 PM = (13*60)+32 = 812
 * This creates a rolling 1440-slot daily history (0–1439) that overwrites each day.
 */
void pushHistoryToFirebase() {
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;
  
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 100)) {
    Serial.println("[History] ⚠️ Time not synced yet — skipping history log.");
    return;
  }
  
  // Key = (hour * 60) + minute  →  e.g. 13:32 = 812
  int minuteOfDay = (timeinfo.tm_hour * 60) + timeinfo.tm_min;
  String historyPath = String(FB_PATH_HISTORY) + "/" + String(minuteOfDay);
  
  FirebaseJson historyJson;
  historyJson.set("temperature", (float)((int)(sensorTemperature * 10)) / 10.0);
  historyJson.set("humidity", (float)((int)(sensorHumidity * 10)) / 10.0);
  historyJson.set("gas", sensorGasRaw);
  historyJson.set("pressure", (float)((int)(sensorPressure * 10)) / 10.0);
  historyJson.set("temperatureBMP", (float)((int)(sensorTempBMP * 10)) / 10.0);
  
  time_t nowSec = time(nullptr);
  historyJson.set("timestamp", (unsigned long)(nowSec) * 1000UL);
  
  // Human-readable timestamp
  char timeStr[32];
  strftime(timeStr, sizeof(timeStr), "%d/%m/%Y %H:%M:%S", &timeinfo);
  historyJson.set("datetime", timeStr);
  
  if (Firebase.RTDB.setJSON(&fbdoSensor, historyPath, &historyJson)) {
    Serial.printf("[History → Firebase] ✅ Key: %d (= %02d:%02d)\n", minuteOfDay, timeinfo.tm_hour, timeinfo.tm_min);
  } else {
    Serial.printf("[History → Firebase] ❌ Failed: %s\n", fbdoSensor.errorReason().c_str());
  }
}

// =================================================================================
//  10. SETUP ROUTINE
// =================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println();
  Serial.println(F("══════════════════════════════════════════════════════════"));
  Serial.println(F("   IoTMesh Common Area Controller (ESP32 WROOM)          "));
  Serial.println(F("   PCF8574 + ULN2003APG → 6 Relay Control               "));
  Serial.println(F("   Sensors: DHT11 + MQ135 + BMP180                      "));
  Serial.println(F("══════════════════════════════════════════════════════════"));
  
  bootTime = millis();
  
  // ── 1. Initialize I²C Bus (PCF8574 + BMP180 share this bus) ──
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);  // 100kHz standard I²C speed
  Serial.printf("[I²C] Bus initialized: SDA=%d, SCL=%d @ 100kHz\n", I2C_SDA, I2C_SCL);
  
  // ── 2. Initialize PCF8574 (All relays OFF) ──
  pcf8574Write(0x00);  // All pins LOW → all relays OFF
  Serial.println(F("[PCF8574] Initialized at address 0x20 — All relays OFF."));
  
  // Verify PCF8574 is responding
  Wire.beginTransmission(PCF8574_ADDRESS);
  uint8_t pcfError = Wire.endTransmission();
  if (pcfError == 0) {
    Serial.println(F("[PCF8574] ✅ Device found and responding on I²C bus."));
  } else {
    Serial.printf("[PCF8574] ❌ Device NOT found at 0x%02X! Error: %d. Check wiring!\n", PCF8574_ADDRESS, pcfError);
  }
  
  // ── 3. Initialize DHT11 Sensor ──
  dht.begin();
  Serial.printf("[DHT11] Initialized on GPIO %d\n", DHT_PIN);
  
  // ── 4. Initialize MQ135 (ADC) ──
  analogReadResolution(12);      // ESP32 ADC: 12-bit (0-4095)
  analogSetAttenuation(ADC_11db); // Full range: ~0-3.3V
  Serial.printf("[MQ135] ADC initialized on GPIO %d (12-bit, 0-3.3V range)\n", MQ135_PIN);
  
  // ── 5. Initialize BMP180 Pressure Sensor ──
  if (bmp.begin()) {
    sensorBMPAvailable = true;
    Serial.println(F("[BMP180] ✅ Sensor initialized successfully at address 0x77."));
  } else {
    sensorBMPAvailable = false;
    Serial.println(F("[BMP180] ❌ Sensor NOT found! Check wiring (SDA/SCL) and address."));
  }
  
  Serial.println(F("[System] Hardware initialization complete."));
  
  // ── 6. Initial Sensor Reading ──
  delay(2000);  // DHT11 needs 1-2s warmup after power on
  readAllSensors();
  
  // ── 7. Connect WiFi (12-second attempt) ──
  connectWiFiNonBlocking();
  
  // ── 8. If connected at boot, initialize Firebase + OTA ──
  if (WiFi.status() == WL_CONNECTED) {
    isOnlineMode = true;
    Serial.println(F("[System] Mode: ONLINE (Cloud Connected)"));
    initializeFirebase();
    initializeOTA();
  } else {
    isOnlineMode = false;
    lastWifiRetry = millis();
    Serial.println();
    Serial.println(F("══════════════════════════════════════════════════════════"));
    Serial.println(F("[System] Mode: OFFLINE (Autonomous Local Control)"));
    Serial.println(F("[System] Relays controllable via direct Firebase on reconnect."));
    Serial.printf("[System] Retrying WiFi every %lu seconds in background...\n", WIFI_RETRY_INTERVAL_MS / 1000);
    Serial.println(F("══════════════════════════════════════════════════════════"));
  }
}

// =================================================================================
//  11. MAIN EXECUTION LOOP
// =================================================================================
void loop() {
  unsigned long currentMillis = millis();
  
  // ── Step 0: OTA update handler ──
  if (isOnlineMode && otaInitialized) {
    ArduinoOTA.handle();
  }
  
  // ── Step 1: WiFi Health & Mode Transition Manager ──
  if (currentMillis - lastWifiCheck >= WIFI_CHECK_INTERVAL_MS) {
    lastWifiCheck = currentMillis;
    handleNetworkHealth();
  }
  
  // ── Step 2: Cloud Operations (ONLY when online) ──
  if (isOnlineMode && WiFi.status() == WL_CONNECTED) {
    if (!firebaseInitialized) {
      initializeFirebase();
    }
    
    if (Firebase.ready()) {
      // 2A: Start stream if not yet active
      if (!firebaseStreamActive) {
        setupFirebaseStream();
      }
      
      // 2B: Process incoming stream events
      if (firebaseStreamActive) {
        if (!Firebase.RTDB.readStream(&fbdoStream)) {
          if (fbdoStream.httpCode() != 0) {
            Serial.printf("[Firebase Stream] Read dropped: %s (HTTP %d)\n",
                          fbdoStream.errorReason().c_str(), fbdoStream.httpCode());
            firebaseStreamActive = false;
          }
        }
      }
      
      // 2C: Status Heartbeat — every 1 second
      if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeat = currentMillis;
        updateFirebaseHeartbeat();
      }
      
      // 2D: Sensor Reading + Push — every 15 seconds
      if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
        lastSensorRead = currentMillis;
        readAllSensors();
        pushSensorDataToFirebase();
      }
      
      // 2E: History Logging — every 1 minute (aligned with minute-of-day slot)
      if (currentMillis - lastHistoryLog >= HISTORY_LOG_INTERVAL_MS) {
        lastHistoryLog = currentMillis;
        pushHistoryToFirebase();
      }
    }
  } else {
    // ── Offline: Still read sensors locally (for when we reconnect) ──
    if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
      lastSensorRead = currentMillis;
      readAllSensors();
    }
  }
  
  // Yield to RTOS background tasks
  yield();
}

// =================================================================================
//  12. FIREBASE REAL-TIME STREAM LISTENER
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
  Serial.println(F("[Firebase] ✅ Stream active. Listening for Common Area commands..."));
}

void handleStreamCallback(FirebaseStream data) {
  Serial.println();
  Serial.println(F("──────────────────────────────────────────────────"));
  Serial.printf("[Firebase Stream] Path: %s | Type: %s | Value: %s\n",
                data.dataPath().c_str(), data.dataType().c_str(), data.stringData().c_str());
  
  String path = data.dataPath();
  String dataType = data.dataType();
  
  bool stateChanged = false;
  
  // ══════════════════════════════════════════════════════════════════
  //  Case A: Root JSON (initial stream connection or multi-update)
  // ══════════════════════════════════════════════════════════════════
  if (dataType == "json" || path == "/") {
    FirebaseJson *json = data.to<FirebaseJson *>();
    if (json != nullptr) {
      FirebaseJsonData jsonData;
      
      // Fan master switch
      if (json->get(jsonData, "fan")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        if (controlFan != val) {
          controlFan = val;
          stateChanged = true;
          Serial.printf("[Cloud] Fan → %s\n", val ? "ON" : "OFF");
        }
      }
      
      // Fan speed
      if (json->get(jsonData, "fanspeed")) {
        int newSpeed = jsonData.intValue;
        if (newSpeed >= 1 && newSpeed <= 3 && controlFanSpeed != newSpeed) {
          controlFanSpeed = newSpeed;
          stateChanged = true;
          Serial.printf("[Cloud] Fan Speed → %d\n", newSpeed);
        }
      }
      
      // Light
      if (json->get(jsonData, "light")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        if (controlLight != val) {
          controlLight = val;
          stateChanged = true;
          Serial.printf("[Cloud] Light → %s\n", val ? "ON" : "OFF");
        }
      }
      
      // Refrigerator
      if (json->get(jsonData, "refrigerator")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        if (controlRefrigerator != val) {
          controlRefrigerator = val;
          stateChanged = true;
          Serial.printf("[Cloud] Refrigerator → %s\n", val ? "ON" : "OFF");
        }
      }
      
      // TV / General Switch
      if (json->get(jsonData, "tv")) {
        bool val = (jsonData.typeNum == FirebaseJson::JSON_BOOL) ? jsonData.boolValue : (jsonData.intValue == 1);
        if (controlTV != val) {
          controlTV = val;
          stateChanged = true;
          Serial.printf("[Cloud] TV → %s\n", val ? "ON" : "OFF");
        }
      }
    }
  }
  // ══════════════════════════════════════════════════════════════════
  //  Case B: Individual child node update (/fan, /light, etc.)
  // ══════════════════════════════════════════════════════════════════
  else {
    if (path == "/fan" || path == "fan") {
      bool val = (dataType == "boolean") ? data.boolData() : (data.intData() == 1 || data.stringData() == "true");
      if (controlFan != val) {
        controlFan = val;
        stateChanged = true;
        Serial.printf("[Cloud] Fan → %s\n", val ? "ON" : "OFF");
      }
    }
    else if (path == "/fanspeed" || path == "fanspeed") {
      int newSpeed = (dataType == "integer" || dataType == "int") ? data.intData() : atoi(data.stringData().c_str());
      if (newSpeed >= 1 && newSpeed <= 3 && controlFanSpeed != newSpeed) {
        controlFanSpeed = newSpeed;
        if (controlFan) stateChanged = true;  // Only update relays if fan is ON
        Serial.printf("[Cloud] Fan Speed → %d\n", newSpeed);
      }
    }
    else if (path == "/light" || path == "light") {
      bool val = (dataType == "boolean") ? data.boolData() : (data.intData() == 1 || data.stringData() == "true");
      if (controlLight != val) {
        controlLight = val;
        stateChanged = true;
        Serial.printf("[Cloud] Light → %s\n", val ? "ON" : "OFF");
      }
    }
    else if (path == "/refrigerator" || path == "refrigerator") {
      bool val = (dataType == "boolean") ? data.boolData() : (data.intData() == 1 || data.stringData() == "true");
      if (controlRefrigerator != val) {
        controlRefrigerator = val;
        stateChanged = true;
        Serial.printf("[Cloud] Refrigerator → %s\n", val ? "ON" : "OFF");
      }
    }
    else if (path == "/tv" || path == "tv") {
      bool val = (dataType == "boolean") ? data.boolData() : (data.intData() == 1 || data.stringData() == "true");
      if (controlTV != val) {
        controlTV = val;
        stateChanged = true;
        Serial.printf("[Cloud] TV → %s\n", val ? "ON" : "OFF");
      }
    }
  }
  
  // Apply relay changes through PCF8574 → ULN2003APG → Relays
  if (stateChanged) {
    updateRelaysFromState();
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
//  13. STATUS HEARTBEAT (Every 1 Second)
// =================================================================================

void updateFirebaseHeartbeat() {
  FirebaseJson jsonStatus;
  jsonStatus.set("online", true);
  jsonStatus.set("ip", WiFi.localIP().toString());
  jsonStatus.set("rssi", WiFi.RSSI());
  jsonStatus.set("uptime", (int)(millis() / 1000));
  jsonStatus.set("freeHeap", (int)ESP.getFreeHeap());
  
  // ESP32 internal chip temperature (available on standard ESP32)
  // Note: temperatureRead() returns chip die temperature, typically 10-20°C above ambient
  float chipTemp = temperatureRead();
  jsonStatus.set("chipTempC", (float)((int)(chipTemp * 10)) / 10.0);
  
  // Firebase RTDB Server Timestamp
  FirebaseJson sv;
  sv.set(".sv", "timestamp");
  jsonStatus.set("serverTimestamp", sv);
  jsonStatus.set("timestamp", sv);
  
  // Last Seen timestamp — formatted using NTP-synced IST clock
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 100)) {
    char lastSeen[32];
    strftime(lastSeen, sizeof(lastSeen), "%d/%m/%Y %H:%M:%S", &timeinfo);
    jsonStatus.set("lastSeen", lastSeen);
    time_t nowSec = time(nullptr);
    jsonStatus.set("lastSeenEpoch", (unsigned long)nowSec);
  }
  
  if (Firebase.RTDB.updateNode(&fbdoWrite, FB_PATH_STATUS, &jsonStatus)) {
    // Silent success for heartbeat (every 1s is too noisy to log each time)
    static unsigned long lastHeartbeatLog = 0;
    if (millis() - lastHeartbeatLog >= 15000) {  // Log confirmation every 15s
      Serial.println(F("[Heartbeat] ✅ Status pushing to Firebase (1s interval)."));
      lastHeartbeatLog = millis();
    }
  } else {
    Serial.printf("[Heartbeat] ❌ Failed: %s\n", fbdoWrite.errorReason().c_str());
  }
}

// =================================================================================
//  14. NETWORK CONNECTION & MANAGEMENT
// =================================================================================

void connectWiFiNonBlocking() {
  Serial.printf("[WiFi] Connecting to SSID: '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  unsigned long startAttemptTime = millis();
  
  // Wait up to 12 seconds for connection
  while (WiFi.status() != WL_CONNECTED && (millis() - startAttemptTime < 12000)) {
    delay(200);
    Serial.print(".");
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("[WiFi] ✅ Connected successfully!"));
    Serial.printf("[WiFi] IP: %s | Signal: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.printf("[WiFi] ⚠️ Not connected yet (Status code: %d). Continuing...\n", WiFi.status());
  }
}

void handleNetworkHealth() {
  unsigned long currentMillis = millis();
  bool wifiConnected = (WiFi.status() == WL_CONNECTED);
  
  // ── CASE 1: WAS ONLINE → NOW DISCONNECTED ──
  if (isOnlineMode && !wifiConnected) {
    isOnlineMode = false;
    firebaseStreamActive = false;
    wifiRetryCount = 0;
    lastWifiRetry = currentMillis;
    
    fbdoStream.clear();
    
    Serial.println();
    Serial.println(F("══════════════════════════════════════════════════════════"));
    Serial.println(F("[Network] ⚠️  WiFi connection lost!"));
    Serial.println(F("[System]  Switching to OFFLINE MODE."));
    Serial.printf("[System]  Retrying every %lu seconds...\n", WIFI_RETRY_INTERVAL_MS / 1000);
    Serial.println(F("══════════════════════════════════════════════════════════"));
    
    // Set all relays to safe state (optional — remove if you want relays to hold state)
    // pcf8574Write(0x00);
    return;
  }
  
  // ── CASE 2: OFFLINE → PERIODIC BACKGROUND RETRY ──
  if (!isOnlineMode) {
    if (!wifiConnected) {
      if (currentMillis - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS) {
        lastWifiRetry = currentMillis;
        wifiRetryCount++;
        Serial.printf("[Offline] Retrying WiFi '%s' (Attempt #%u)...\n", WIFI_SSID, wifiRetryCount);
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      }
      return;
    }
    
    // ── CASE 3: WAS OFFLINE → WIFI RECONNECTED ──
    isOnlineMode = true;
    wifiRetryCount = 0;
    
    Serial.println();
    Serial.println(F("══════════════════════════════════════════════════════════"));
    Serial.println(F("[Network] ✅ WiFi Reconnected!"));
    Serial.printf("[Network] IP: %s | Signal: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    Serial.println(F("[System]  OFFLINE → ONLINE MODE. Resuming cloud services..."));
    Serial.println(F("══════════════════════════════════════════════════════════"));
    
    if (!firebaseInitialized) {
      initializeFirebase();
    } else {
      firebaseStreamActive = false;
      setupFirebaseStream();
    }
    
    if (!otaInitialized) {
      initializeOTA();
    }
    
    // Force immediate heartbeat + sensor push on reconnection
    lastHeartbeat = currentMillis;
    updateFirebaseHeartbeat();
    
    readAllSensors();
    pushSensorDataToFirebase();
    pushHistoryToFirebase();
  }
}

// =================================================================================
//  15. FIREBASE CLIENT INITIALIZATION
// =================================================================================

void initializeFirebase() {
  if (firebaseInitialized) return;
  
  Serial.println(F("[Firebase] Initializing client..."));
  
  // ── NTP Time Sync (CRITICAL for SSL certificate validation) ──
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
    }
    Serial.println();
    if (getLocalTime(&timeinfo)) {
      ntpSynced = true;
      Serial.printf("[Firebase] ✅ Time synced: %02d:%02d:%02d IST\n",
                    timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    } else {
      Serial.println(F("[Firebase] ⚠️  NTP sync timed out — SSL errors may occur."));
    }
  }
  
  fbConfig.database_url = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_DB_SECRET;
  
  // Connection timeouts
  fbConfig.timeout.wifiReconnect       = 5000;
  fbConfig.timeout.socketConnection    = 5000;
  fbConfig.timeout.sslHandshake        = 6000;
  fbConfig.timeout.rtdbKeepAlive       = 45000;
  fbConfig.timeout.rtdbStreamReconnect = 5000;
  
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(false);  // We manage WiFi ourselves
  
  // SSL buffer sizes (optimized for ESP32 with more RAM than ESP32-C3)
  fbdoStream.setResponseSize(4096);
  fbdoStream.setBSSLBufferSize(4096, 1024);
  
  fbdoWrite.setResponseSize(2048);
  fbdoWrite.setBSSLBufferSize(4096, 1024);
  
  fbdoSensor.setResponseSize(2048);
  fbdoSensor.setBSSLBufferSize(4096, 1024);
  
  firebaseInitialized = true;
  Serial.println(F("[Firebase] ✅ Client initialized. Waiting for authentication..."));
}

// =================================================================================
//  16. OTA (OVER-THE-AIR) UPDATE
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
    if      (error == OTA_AUTH_ERROR)    Serial.println(F("Authentication failed"));
    else if (error == OTA_BEGIN_ERROR)   Serial.println(F("Begin failed"));
    else if (error == OTA_CONNECT_ERROR) Serial.println(F("Connect failed"));
    else if (error == OTA_RECEIVE_ERROR) Serial.println(F("Receive failed"));
    else if (error == OTA_END_ERROR)     Serial.println(F("End failed"));
  });
  
  ArduinoOTA.begin();
  otaInitialized = true;
  Serial.printf("[OTA] ✅ Ready! Hostname: '%s'\n", OTA_HOSTNAME);
}
