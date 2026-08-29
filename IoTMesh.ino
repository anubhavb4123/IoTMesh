/*
 * ══════════════════════════════════════════════════════════════════════════════════
 *   IoTMesh Room 1 Node Firmware (Production Release v1.0.0)
 * ══════════════════════════════════════════════════════════════════════════════════
 * 
 * Target Controller: ESP32 Dev Module (Classic Dual-Core ESP-WROOM-32)
 * Framework:         Arduino IDE (Arduino-ESP32 Core v2.x / v3.x)
 * 
 * Hardware Subsystems:
 *  1. Microcontroller: ESP32 Dev Module (WiFi + Hardware I2C on GPIO 21/22)
 *  2. Sensors:
 *     - MQ135 Air Quality Gas Sensor (ESP32 ADC1: GPIO 34)
 *     - GY-68 / BMP180 Digital Barometric Pressure Sensor (I2C: 0x77)
 *     - DHT11 Digital Temperature & Humidity Sensor (Single-Wire: GPIO 4)
 *     - Voltage Sensor / Resistor Divider Module (ESP32 ADC1: GPIO 36 / VP)
 *  3. Display:
 *     - 16x2 HD44780 LCD via PCF8574 I2C Backpack (I2C: 0x27 or 0x3F)
 *  4. Actuator Driver:
 *     - PCF8574 8-Bit I/O Expander (I2C: 0x20) -> ULN2003APG Darlington Array -> 5V/12V Relay Coils
 * 
 * Firebase Realtime Database:
 *  - URL: https://iotmesh-4123-default-rtdb.firebaseio.com/
 *  - Controls Monitored: /home/room1/controls/
 *  - Sensor Telemetry:   /home/sensors/ & /home/room1/sensor
 *  - Device Health:      /home/room1/status
 * 
 * ══════════════════════════════════════════════════════════════════════════════════
 */

// =================================================================================
//  1. REQUIRED LIBRARIES & SYSTEM HEADERS
// =================================================================================
#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Adafruit_BMP085.h>
#include <DHT.h>
#include <Firebase_ESP_Client.h>

// Provide Firebase token and RTDB helpers from Mobizt library
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// =================================================================================
//  2. NETWORK & FIREBASE CONFIGURATION
// =================================================================================
#define WIFI_SSID               "12345"                       // Your WiFi Network SSID
#define WIFI_PASSWORD           "88888888"                   // Your WiFi Password

// Firebase Project Credentials
#define FIREBASE_HOST           "https://iotmesh-4123-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH_KEY       "AIzaSyCOncUZJrlqdXbRBcHRVwMLfy2nNU6-AGI" // Web API Key

// Database Paths
#define FB_PATH_CONTROLS        "/home/room1/controls"
#define FB_PATH_SENSORS         "/home/sensors"
#define FB_PATH_ROOM_SENSOR     "/home/room1/sensor"
#define FB_PATH_STATUS          "/home/room1/status"

// =================================================================================
//  3. PIN CONFIGURATION (ESP32 GPIO ASSIGNMENTS)
// =================================================================================
// I2C Bus Pins (ESP32 Classic default hardware I2C)
#define I2C_SDA_PIN             21
#define I2C_SCL_PIN             22

// Digital & Analog Sensor Pins
// NOTE: On ESP32, ADC1 pins (GPIO 32-39) MUST be used when WiFi is active.
// ADC2 pins are internally reserved by the ESP32 Wi-Fi subsystem.
#define DHT_PIN                 4        // DHT11 Data Pin (Digital GPIO)
#define DHT_TYPE                DHT11    // Sensor Model: DHT11

#define MQ135_PIN               34       // MQ135 Analog Out (ADC1_CH6, Input Only)
#define VOLTAGE_SENSOR_PIN      36       // Voltage Divider Sensor (ADC1_CH0 / VP, Input Only)

#define STATUS_LED_PIN          2        // ESP32 Onboard Diagnostic Blue LED

// =================================================================================
//  4. I2C ADDRESSES & EXPANDER PIN DEFINITIONS
// =================================================================================
#define LCD_DEFAULT_ADDR        0x27     // Common LCD addresses: 0x27 or 0x3F
#define BMP180_I2C_ADDR         0x77     // Standard Bosch BMP180/GY-68 address
#define PCF8574_RELAY_ADDR      0x20     // I2C Expander for ULN2003APG (0x20-0x27 selectable via A0,A1,A2)

#define ENABLE_I2C_DEBUG        true     // Set true to perform active I2C bus scan at boot

// PCF8574 Pin Mapping to ULN2003APG Inputs (Pins 0 to 7)
// ULN2003APG: Logic HIGH input turns ON internal Darlington transistor (sinks coil to GND)
#define PCF_RELAY_LOBBY_FAN     0        // PCF8574 P0 -> ULN2003 IN1 -> Relay 1 (Lobby Fan)
#define PCF_RELAY_LOBBY_LIGHT   1        // PCF8574 P1 -> ULN2003 IN2 -> Relay 2 (Lobby Light)
#define PCF_RELAY_LOBBY_TV      2        // PCF8574 P2 -> ULN2003 IN3 -> Relay 3 (Lobby TV)
#define PCF_RELAY_REFRIGERATOR  3        // PCF8574 P3 -> ULN2003 IN4 -> Relay 4 (Refrigerator)

// Relay Driver Logic Level:
// With PCF8574 driving ULN2003APG input directly:
//   HIGH on PCF8574 -> HIGH on ULN2003 IN -> ULN2003 OUT pulls LOW (conducts) -> Relay Coil Energized (ON)
//   LOW on PCF8574  -> LOW on ULN2003 IN  -> ULN2003 OUT Floating (OFF)       -> Relay Coil De-energized (OFF)
#define RELAY_ACTIVE_STATE      HIGH     // Active HIGH input for ULN2003
#define RELAY_INACTIVE_STATE    LOW      // Inactive LOW input for ULN2003

// =================================================================================
//  5. TIMING & SCHEDULING INTERVALS (NON-BLOCKING millis())
// =================================================================================
const unsigned long INTERVAL_SENSOR_READ_MS      = 2000;   // Read physical sensors every 2 seconds
const unsigned long INTERVAL_FIREBASE_UPLOAD_MS  = 5000;   // Push sensor data to RTDB every 5 seconds
const unsigned long INTERVAL_LCD_ROTATE_MS       = 3000;   // Rotate LCD screen view every 3 seconds
const unsigned long INTERVAL_WIFI_CHECK_MS       = 10000;  // Verify WiFi connection health every 10s
const unsigned long INTERVAL_STATUS_HEARTBEAT_MS = 15000;  // Push online status heartbeat every 15s
const unsigned long INTERVAL_STREAM_WATCHDOG_MS  = 45000;  // Restart Firebase stream if stalled

// =================================================================================
//  6. CALIBRATION CONSTANTS
// =================================================================================
// Voltage Divider Calibration:
// Standard 25V voltage divider module: R1 = 30kΩ, R2 = 7.5kΩ (Divider Ratio = (30+7.5)/7.5 = 5.0)
// ESP32 ADC: 12-bit (0..4095) with 3.3V reference voltage.
const float VOLTAGE_DIVIDER_RATIO = 5.0f;
const float ESP32_ADC_VREF        = 3.30f;
const float VOLTAGE_CALIB_OFFSET  = 0.00f; // Fine-tune voltage offset in Volts if needed

// MQ135 Analog Baseline
const float MQ135_CLEAN_AIR_ADC   = 400.0f; // Typical clean room baseline

// =================================================================================
//  7. DATA STRUCTURES & GLOBAL INSTANCES
// =================================================================================

// Telemetry Data Structure
struct SensorTelemetry {
  float temperatureDHT;      // °C from DHT11
  float humidityDHT;         // % from DHT11
  float temperatureBMP;      // °C from BMP180
  float pressureHPa;         // hPa from BMP180
  float altitudeMeters;      // Calculated altitude (m)
  int   airQualityRaw;       // Raw 12-bit ADC reading from MQ135 (0-4095)
  float airQualityIndex;     // Normalized air quality metric (0-100%)
  float busVoltage;          // Measured input voltage (V)
  bool  dhtValid;            // Validity flag
  bool  bmpValid;            // Validity flag
};

// Control States Structure (Synchronized with Firebase /home/room1/controls)
struct NodeControls {
  bool lobbyFan;             // Fan Relay ON/OFF
  int  lobbyFanSpeed;        // Stored speed level (0-5 or 0-100)
  bool lobbyLight;           // Light Relay ON/OFF
  bool lobbyTV;              // TV Relay ON/OFF
  bool refrigerator;         // Refrigerator Relay ON/OFF
  bool motion;               // Security/Motion Control State (Flag)
};

// Global System Objects
SensorTelemetry telemetry = { 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0, 0.0f, 0.0f, false, false };
NodeControls    controls  = { false, 0, false, false, false, false };

// Peripherals Instances
LiquidCrystal_I2C lcd(LCD_DEFAULT_ADDR, 16, 2);
Adafruit_BMP085   bmp;
DHT               dht(DHT_PIN, DHT_TYPE);

// Firebase Data Objects
FirebaseData      fbdoStream;      // Dedicated stream object for real-time listener
FirebaseData      fbdoWrite;       // Dedicated object for telemetry writes
FirebaseAuth      fbAuth;
FirebaseConfig    fbConfig;

// Operational States
uint8_t  pcfCurrentPortState       = 0x00;   // Cache of current PCF8574 output pins
bool     pcf8574Available          = false;  // Flag if dedicated relay PCF8574 is detected
bool     lcdInitialized            = false;  // Flag if LCD is active
bool     bmpInitialized            = false;  // Flag if BMP180 is active
uint8_t  currentLcdScreen          = 0;      // Current active LCD page (0..4)
bool     firebaseStreamActive      = false;

// Task Timers
unsigned long lastSensorReadMs     = 0;
unsigned long lastFirebaseUploadMs = 0;
unsigned long lastLcdRotateMs      = 0;
unsigned long lastWifiCheckMs      = 0;
unsigned long lastStatusUpdateMs   = 0;
unsigned long lastStreamActivityMs = 0;
unsigned long systemBootTimeMs     = 0;

// =================================================================================
//  8. FORWARD DECLARATIONS
// =================================================================================
void scanI2CBus();
void initializePCF8574();
void initializeLCD();
void initializeSensors();
void connectWiFi();
void initializeFirebase();
void setupFirebaseStream();

void readSensors();
void readDHT11();
void readBMP180();
void readMQ135();
void readVoltage();

void updateFirebase();
void updateFirebaseStatus(bool isOnline);
void handleStreamCallback(FirebaseStream data);
void handleStreamTimeoutCallback(bool matched);
void applyRelayStates();
void setRelay(uint8_t relayPin, bool state);
void writePCF8574(uint8_t data);

void updateLCD();
void renderScreen0(); // Temp & Humidity
void renderScreen1(); // Pressure & Air Quality
void renderScreen2(); // Voltage & Fan
void renderScreen3(); // Light & TV
void renderScreen4(); // Refrigerator & WiFi Status

void checkWiFi();
void handleFirebaseError(FirebaseData &fbdo, const char* context);
void printSystemStatus();

// =================================================================================
//  9. SETUP ROUTINE
// =================================================================================
void setup() {
  // Initialize USB Serial Diagnostic Port
  Serial.begin(115200);
  delay(500);

  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  Serial.println();
  Serial.println(F("=================================================="));
  Serial.println(F("           IoTMesh Hardware Node v1.0             "));
  Serial.println(F("      ESP32 Room1 Controller + Telemetry          "));
  Serial.println(F("=================================================="));
  Serial.printf("[System] ESP32 Chip Rev: %d | CPU Freq: %d MHz\n", ESP.getChipRevision(), ESP.getCpuFreqMHz());
  Serial.printf("[System] Free Heap: %d bytes\n", ESP.getFreeHeap());

  // 1. Initialize Hardware I2C Bus
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, 100000); // 100kHz standard I2C clock
  Serial.printf("[I2C] Initialized on SDA: GPIO %d, SCL: GPIO %d\n", I2C_SDA_PIN, I2C_SCL_PIN);

  // 2. Scan I2C bus if enabled
  #if ENABLE_I2C_DEBUG
    scanI2CBus();
  #endif

  // 3. Initialize PCF8574 Relay Driver (ULN2003APG)
  initializePCF8574();

  // 4. Initialize LCD Display
  initializeLCD();

  // 5. Initialize Physical Sensors
  initializeSensors();

  // 6. Connect to WiFi Network
  connectWiFi();

  // 7. Initialize Firebase Realtime Database
  initializeFirebase();

  // 8. Initial Sensor Read & Apply Default Relays (Safe OFF)
  readSensors();
  applyRelayStates();

  systemBootTimeMs = millis();
  printSystemStatus();
  Serial.println(F("=================================================="));
  Serial.println(F("[System] Setup Complete — Entering Non-Blocking Loop"));
  Serial.println(F("=================================================="));
}

// =================================================================================
//  10. MAIN EXECUTION LOOP (NON-BLOCKING)
// =================================================================================
void loop() {
  unsigned long currentMs = millis();

  // ── Task 1: Stream Watchdog & Reconnection ─────────────────────────
  if (Firebase.ready() && (!firebaseStreamActive || (currentMs - lastStreamActivityMs > INTERVAL_STREAM_WATCHDOG_MS))) {
    setupFirebaseStream();
    lastStreamActivityMs = currentMs;
  }

  // ── Task 2: Sensor Telemetry Acquisition (Every 2s) ────────────────
  if (currentMs - lastSensorReadMs >= INTERVAL_SENSOR_READ_MS) {
    lastSensorReadMs = currentMs;
    readSensors();
  }

  // ── Task 3: Firebase Telemetry Sync (Every 5s) ─────────────────────
  if (currentMs - lastFirebaseUploadMs >= INTERVAL_FIREBASE_UPLOAD_MS) {
    lastFirebaseUploadMs = currentMs;
    if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
      updateFirebase();
    }
  }

  // ── Task 4: LCD Screen Pagination & Refresh (Every 3s) ─────────────
  if (currentMs - lastLcdRotateMs >= INTERVAL_LCD_ROTATE_MS) {
    lastLcdRotateMs = currentMs;
    currentLcdScreen = (currentLcdScreen + 1) % 5;
    updateLCD();
  }

  // ── Task 5: Heartbeat & Online Status Update (Every 15s) ───────────
  if (currentMs - lastStatusUpdateMs >= INTERVAL_STATUS_HEARTBEAT_MS) {
    lastStatusUpdateMs = currentMs;
    if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
      updateFirebaseStatus(true);
    }
  }

  // ── Task 6: Network Connectivity Health Check (Every 10s) ──────────
  if (currentMs - lastWifiCheckMs >= INTERVAL_WIFI_CHECK_MS) {
    lastWifiCheckMs = currentMs;
    checkWiFi();
  }

  // Yield to ESP32 RTOS background scheduler
  yield();
}

// =================================================================================
//  11. I2C BUS SCANNER & INITIALIZATION
// =================================================================================
void scanI2CBus() {
  Serial.println(F("[I2C] Scanning I2C bus for connected devices..."));
  byte count = 0;
  for (byte i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.printf(" - Found device at address: 0x%02X", i);
      if (i == 0x27 || i == 0x3F) Serial.print(F(" (LCD Backpack PCF8574)"));
      else if (i == 0x77)         Serial.print(F(" (GY-68 / BMP180 Pressure Sensor)"));
      else if (i >= 0x20 && i <= 0x26) Serial.print(F(" (PCF8574 I/O Expander - Relay Driver)"));
      else if (i >= 0x38 && i <= 0x3E) Serial.print(F(" (PCF8574A I/O Expander - Relay Driver)"));
      Serial.println();
      count++;
    }
  }
  if (count == 0) {
    Serial.println(F("[I2C] ⚠️ No I2C devices found. Check SDA/SCL wiring and pull-ups!"));
  } else {
    Serial.printf("[I2C] Scan complete. Total %d device(s) detected.\n", count);
  }
}

// =================================================================================
//  12. PCF8574 RELAY EXPANDER INITIALIZATION & LOW-LEVEL DRIVER
// =================================================================================
void initializePCF8574() {
  Serial.print(F("[PCF8574] Initializing Relay Driver Expander at 0x"));
  Serial.println(PCF8574_RELAY_ADDR, HEX);

  Wire.beginTransmission(PCF8574_RELAY_ADDR);
  byte error = Wire.endTransmission();

  if (error == 0) {
    pcf8574Available = true;
    // Set all PCF8574 pins LOW at startup so ULN2003 Darlington base inputs remain OFF
    pcfCurrentPortState = 0x00;
    writePCF8574(pcfCurrentPortState);
    Serial.println(F("[PCF8574] ✅ Driver detected. All relays initialized in safe OFF state."));
  } else {
    pcf8574Available = false;
    Serial.printf("[PCF8574] ⚠️ Expander not found at 0x%02X (Error: %d). Check address jumper A0/A1/A2.\n", PCF8574_RELAY_ADDR, error);
  }
}

void writePCF8574(uint8_t data) {
  Wire.beginTransmission(PCF8574_RELAY_ADDR);
  Wire.write(data);
  byte status = Wire.endTransmission();
  if (status != 0) {
    Serial.printf("[PCF8574] ❌ Write error: %d\n", status);
  }
}

// =================================================================================
//  13. LCD INITIALIZATION & MULTI-SCREEN PAGINATION
// =================================================================================
void initializeLCD() {
  Serial.print(F("[LCD] Initializing 16x2 I2C Display... "));
  
  // Test communication with LCD address
  Wire.beginTransmission(LCD_DEFAULT_ADDR);
  if (Wire.endTransmission() == 0) {
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(F("IoTMesh Node"));
    lcd.setCursor(0, 1);
    lcd.print(F("Booting v1.0..."));
    lcdInitialized = true;
    Serial.println(F("✅ OK"));
  } else {
    // Try alternate standard address 0x3F
    Wire.beginTransmission(0x3F);
    if (Wire.endTransmission() == 0) {
      lcd = LiquidCrystal_I2C(0x3F, 16, 2);
      lcd.init();
      lcd.backlight();
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print(F("IoTMesh Node"));
      lcdInitialized = true;
      Serial.println(F("✅ OK (Detected at 0x3F)"));
    } else {
      lcdInitialized = false;
      Serial.println(F("⚠️ Failed to detect LCD at 0x27 or 0x3F"));
    }
  }
}

// =================================================================================
//  14. PHYSICAL SENSOR INITIALIZATION
// =================================================================================
void initializeSensors() {
  Serial.println(F("[Sensors] Initializing Subsystems..."));

  // 1. DHT11
  dht.begin();
  Serial.printf(" - DHT11 Data Pin: GPIO %d ✅\n", DHT_PIN);

  // 2. BMP180 Barometer
  if (bmp.begin()) {
    bmpInitialized = true;
    Serial.println(F(" - BMP180 / GY-68 Barometer: Detected at 0x77 ✅"));
  } else {
    bmpInitialized = false;
    Serial.println(F(" - BMP180 / GY-68: ⚠️ Sensor NOT detected at 0x77. Verify VCC/GND/SDA/SCL."));
  }

  // 3. MQ135 ADC Configuration
  pinMode(MQ135_PIN, INPUT);
  analogSetPinAttenuation(MQ135_PIN, ADC_11db); // Full-scale 0-3.3V
  Serial.printf(" - MQ135 Analog In: GPIO %d (ADC1_CH6) ✅\n", MQ135_PIN);

  // 4. Voltage Divider Sensor Configuration
  pinMode(VOLTAGE_SENSOR_PIN, INPUT);
  analogSetPinAttenuation(VOLTAGE_SENSOR_PIN, ADC_11db); // Full-scale 0-3.3V
  Serial.printf(" - Voltage Sensor: GPIO %d (ADC1_CH0) ✅\n", VOLTAGE_SENSOR_PIN);
}

// =================================================================================
//  15. SENSOR READ ROUTINES (ROBUST, NON-BLOCKING, MULTI-SAMPLED)
// =================================================================================
void readSensors() {
  readDHT11();
  readBMP180();
  readMQ135();
  readVoltage();
}

void readDHT11() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t) || h <= 0.0f || h > 100.0f || t < -40.0f || t > 80.0f) {
    telemetry.dhtValid = false;
    // Retain previous valid reading if available rather than setting NaN
  } else {
    telemetry.humidityDHT    = h;
    telemetry.temperatureDHT = t;
    telemetry.dhtValid       = true;
  }
}

void readBMP180() {
  if (!bmpInitialized) {
    telemetry.bmpValid = false;
    return;
  }

  float t = bmp.readTemperature();
  float p = bmp.readPressure() / 100.0F; // Convert Pa to hPa

  if (isnan(t) || isnan(p) || p < 300.0f || p > 1200.0f) {
    telemetry.bmpValid = false;
  } else {
    telemetry.temperatureBMP = t;
    telemetry.pressureHPa    = p;
    telemetry.altitudeMeters = bmp.readAltitude(101325); // Standard sea level pressure 1013.25 hPa
    telemetry.bmpValid       = true;
  }
}

void readMQ135() {
  // Take 8-sample moving average to dampen 50Hz/60Hz AC noise and ADC ripple
  long sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += analogRead(MQ135_PIN);
    delayMicroseconds(200);
  }
  int rawAdc = (int)(sum / 8);
  telemetry.airQualityRaw = rawAdc;

  // Normalized relative air quality index (0.0 to 100.0%)
  // Note: Raw ADC is not direct ppm without heated pre-burn & calibration formula
  float index = ((float)rawAdc / 4095.0f) * 100.0f;
  if (index < 0.0f) index = 0.0f;
  if (index > 100.0f) index = 100.0f;
  telemetry.airQualityIndex = index;
}

void readVoltage() {
  // Take 16-sample moving average for stable DC bus voltage measurement
  long sum = 0;
  for (int i = 0; i < 16; i++) {
    sum += analogRead(VOLTAGE_SENSOR_PIN);
    delayMicroseconds(100);
  }
  float avgAdc = (float)sum / 16.0f;

  // Calculate pin voltage based on 12-bit ESP32 ADC (3.3V reference)
  float pinVoltage = (avgAdc / 4095.0f) * ESP32_ADC_VREF;

  // Multiply by hardware divider ratio and add calibration offset
  float measuredBusVoltage = (pinVoltage * VOLTAGE_DIVIDER_RATIO) + VOLTAGE_CALIB_OFFSET;

  if (measuredBusVoltage < 0.05f) measuredBusVoltage = 0.0f; // Zero floor threshold
  telemetry.busVoltage = measuredBusVoltage;
}

// =================================================================================
//  16. WIFI MANAGEMENT & AUTO-RECOVERY
// =================================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WiFi] Connecting to SSID: '%s' ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startMs < 12000)) {
    delay(400);
    Serial.print(F("."));
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    Serial.println(F("[WiFi] ✅ Connected Successfully!"));
    Serial.printf("[WiFi] IP Assigned: %s | RSSI: %d dBm | MAC: %s\n",
                  WiFi.localIP().toString().c_str(),
                  WiFi.RSSI(),
                  WiFi.macAddress().c_str());
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);
    Serial.println(F("[WiFi] ⚠️ Failed to connect. Operating in Offline Safe Mode."));
  }
}

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WiFi] Connection dropped! Attempting background reconnect..."));
    digitalWrite(STATUS_LED_PIN, LOW);
    WiFi.disconnect();
    WiFi.reconnect();
  }
}

// =================================================================================
//  17. FIREBASE INITIALIZATION & REAL-TIME STREAM LISTENER
// =================================================================================
void initializeFirebase() {
  Serial.println(F("[Firebase] Configuring Realtime Database Client..."));

  // Assign Firebase Host and API Key
  fbConfig.host = FIREBASE_HOST;
  fbConfig.api_key = FIREBASE_AUTH_KEY;
  fbConfig.signer.tokens.legacy_token = ""; // Leave blank for anonymous / API key auth

  // Configure connection & response timeouts
  fbConfig.timeout.wifiReconnect = 10000;
  fbConfig.timeout.socketConnection = 10000;
  fbConfig.timeout.sslHandshake = 15000;
  fbConfig.timeout.rtdbKeepAlive = 45000;
  fbConfig.timeout.rtdbStreamReconnect = 10000;
  fbConfig.timeout.rtdbStreamError = 3000;

  // Initialize Firebase Client
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);

  // Set buffer sizes for robust streaming
  fbdoStream.setResponseSize(2048);
  fbdoWrite.setResponseSize(1024);

  Serial.println(F("[Firebase] Initialization done. Preparing stream..."));
}

void setupFirebaseStream() {
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;

  Serial.printf("[Firebase] Subscribing to Stream on path: %s ...\n", FB_PATH_CONTROLS);

  if (!Firebase.RTDB.beginStream(&fbdoStream, FB_PATH_CONTROLS)) {
    Serial.printf("[Firebase] ❌ Stream start failed: %s\n", fbdoStream.errorReason().c_str());
    firebaseStreamActive = false;
    return;
  }

  // Attach event callbacks
  Firebase.RTDB.setStreamCallback(&fbdoStream, handleStreamCallback, handleStreamTimeoutCallback);
  firebaseStreamActive = true;
  lastStreamActivityMs = millis();
  Serial.println(F("[Firebase] ✅ Stream active. Real-time control listener operational."));
}

// =================================================================================
//  18. FIREBASE STREAM & CONTROL EVENT HANDLERS
// =================================================================================
void handleStreamCallback(FirebaseStream data) {
  lastStreamActivityMs = millis();
  Serial.println();
  Serial.println(F("──────────────────────────────────────────────────"));
  Serial.printf("[Firebase Stream] Event Path: %s | Data Type: %s\n", data.dataPath().c_str(), data.dataType().c_str());

  String path = data.dataPath();

  // Case A: Root JSON object received (e.g. on initial connection)
  if (data.dataType() == "json" || path == "/") {
    FirebaseJson *json = data.to<FirebaseJson *>();
    FirebaseJsonData jsonData;

    // 1. lobbyFan
    if (json->get(jsonData, "lobbyFan")) {
      controls.lobbyFan = jsonData.to<bool>();
      Serial.printf(" - lobbyFan: %s\n", controls.lobbyFan ? "ON" : "OFF");
    }

    // 2. lobbyFanSpeed
    if (json->get(jsonData, "lobbyFanSpeed")) {
      controls.lobbyFanSpeed = jsonData.to<int>();
      Serial.printf(" - lobbyFanSpeed: %d\n", controls.lobbyFanSpeed);
    }

    // 3. lobbyLight
    if (json->get(jsonData, "lobbyLight")) {
      controls.lobbyLight = jsonData.to<bool>();
      Serial.printf(" - lobbyLight: %s\n", controls.lobbyLight ? "ON" : "OFF");
    }

    // 4. lobbyTV
    if (json->get(jsonData, "lobbyTV")) {
      controls.lobbyTV = jsonData.to<bool>();
      Serial.printf(" - lobbyTV: %s\n", controls.lobbyTV ? "ON" : "OFF");
    }

    // 5. refrigerator
    if (json->get(jsonData, "refrigerator")) {
      controls.refrigerator = jsonData.to<bool>();
      Serial.printf(" - refrigerator: %s\n", controls.refrigerator ? "ON" : "OFF");
    }

    // 6. motion
    if (json->get(jsonData, "motion")) {
      controls.motion = jsonData.to<bool>();
      Serial.printf(" - motion (flag): %s\n", controls.motion ? "ACTIVE" : "IDLE");
    }
  }
  // Case B: Individual child node updated
  else {
    if (path == "/lobbyFan") {
      controls.lobbyFan = data.boolData();
      Serial.printf(" - [UPDATE] lobbyFan: %s\n", controls.lobbyFan ? "ON" : "OFF");
    } else if (path == "/lobbyFanSpeed") {
      controls.lobbyFanSpeed = data.intData();
      Serial.printf(" - [UPDATE] lobbyFanSpeed: %d\n", controls.lobbyFanSpeed);
    } else if (path == "/lobbyLight") {
      controls.lobbyLight = data.boolData();
      Serial.printf(" - [UPDATE] lobbyLight: %s\n", controls.lobbyLight ? "ON" : "OFF");
    } else if (path == "/lobbyTV") {
      controls.lobbyTV = data.boolData();
      Serial.printf(" - [UPDATE] lobbyTV: %s\n", controls.lobbyTV ? "ON" : "OFF");
    } else if (path == "/refrigerator") {
      controls.refrigerator = data.boolData();
      Serial.printf(" - [UPDATE] refrigerator: %s\n", controls.refrigerator ? "ON" : "OFF");
    } else if (path == "/motion") {
      controls.motion = data.boolData();
      Serial.printf(" - [UPDATE] motion: %s\n", controls.motion ? "ACTIVE" : "IDLE");
    }
  }

  // Immediately apply new hardware relay outputs
  applyRelayStates();
  Serial.println(F("──────────────────────────────────────────────────"));
}

void handleStreamTimeoutCallback(bool matched) {
  if (matched) {
    Serial.println(F("[Firebase Stream] ⚠️ Stream timeout detected. Will auto-resume."));
  }
}

// =================================================================================
//  19. RELAY & ULN2003 DRIVER LOGIC
// =================================================================================
void applyRelayStates() {
  setRelay(PCF_RELAY_LOBBY_FAN,    controls.lobbyFan);
  setRelay(PCF_RELAY_LOBBY_LIGHT,  controls.lobbyLight);
  setRelay(PCF_RELAY_LOBBY_TV,     controls.lobbyTV);
  setRelay(PCF_RELAY_REFRIGERATOR, controls.refrigerator);

  if (pcf8574Available) {
    writePCF8574(pcfCurrentPortState);
  }
}

void setRelay(uint8_t pinBit, bool turnOn) {
  // When turnOn is true, set the PCF8574 bit to HIGH (sends 5V to ULN2003 input).
  // ULN2003 in turn grounds the relay coil, energizing the relay.
  if (turnOn) {
    pcfCurrentPortState |= (1 << pinBit);
  } else {
    pcfCurrentPortState &= ~(1 << pinBit);
  }
}

// =================================================================================
//  20. FIREBASE TELEMETRY UPLOAD (ROBUST JSON PAYLOAD)
// =================================================================================
void updateFirebase() {
  FirebaseJson jsonSensors;
  FirebaseJson jsonRoomSensor;

  // Use primary temperature (prefer DHT11 if valid, else BMP180)
  float effectiveTemp = telemetry.dhtValid ? telemetry.temperatureDHT : (telemetry.bmpValid ? telemetry.temperatureBMP : 0.0f);
  float effectiveHum  = telemetry.dhtValid ? telemetry.humidityDHT : 0.0f;
  float effectivePres = telemetry.bmpValid ? telemetry.pressureHPa : 1013.25f;

  unsigned long uptimeSec = (millis() - systemBootTimeMs) / 1000;

  // 1. Build Payload for /home/sensors/
  jsonSensors.set("temperature", effectiveTemp);
  jsonSensors.set("humidity", effectiveHum);
  jsonSensors.set("pressure", effectivePres);
  jsonSensors.set("altitude", telemetry.altitudeMeters);
  jsonSensors.set("airQualityRaw", telemetry.airQualityRaw);
  jsonSensors.set("airQualityIndex", telemetry.airQualityIndex);
  jsonSensors.set("voltage", telemetry.busVoltage);
  jsonSensors.set("wifiRssi", WiFi.RSSI());
  jsonSensors.set("uptime", uptimeSec);
  jsonSensors.set("timestamp", (double)millis());

  // 2. Build Payload for /home/room1/sensor (Web App format compatibility)
  jsonRoomSensor.set("temperature", effectiveTemp);
  jsonRoomSensor.set("temperatureBMP", telemetry.temperatureBMP);
  jsonRoomSensor.set("humidity", effectiveHum);
  jsonRoomSensor.set("pressure", effectivePres);
  jsonRoomSensor.set("gas", telemetry.airQualityRaw);
  jsonRoomSensor.set("batteryVolt", telemetry.busVoltage);
  jsonRoomSensor.set("motion", controls.motion);
  jsonRoomSensor.set("timestamp", (double)millis());

  // Perform non-blocking writes using dedicated write object
  if (Firebase.RTDB.updateNode(&fbdoWrite, FB_PATH_SENSORS, &jsonSensors)) {
    // Also push to web app schema
    Firebase.RTDB.updateNode(&fbdoWrite, FB_PATH_ROOM_SENSOR, &jsonRoomSensor);
    Serial.printf("[Firebase] 📤 Telemetry Pushed: T=%.1f°C | H=%.1f%% | P=%.1fhPa | AQ=%d | V=%.2fV\n",
                  effectiveTemp, effectiveHum, effectivePres, telemetry.airQualityRaw, telemetry.busVoltage);
  } else {
    handleFirebaseError(fbdoWrite, "Telemetry Upload");
  }
}

void updateFirebaseStatus(bool isOnline) {
  FirebaseJson jsonStatus;
  jsonStatus.set("online", isOnline);
  jsonStatus.set("lastSeen", (double)millis());
  jsonStatus.set("rssi", WiFi.RSSI());
  jsonStatus.set("ip", WiFi.localIP().toString());
  jsonStatus.set("freeHeap", (int)ESP.getFreeHeap());

  Firebase.RTDB.updateNode(&fbdoWrite, FB_PATH_STATUS, &jsonStatus);
}

void handleFirebaseError(FirebaseData &fbdo, const char* context) {
  Serial.printf("[Firebase Error] %s failed! Reason: %s (Code: %d)\n",
                context,
                fbdo.errorReason().c_str(),
                fbdo.httpCode());
}

// =================================================================================
//  21. LCD DISPLAY RENDERING (FLICKER-FREE REFRESH)
// =================================================================================
void updateLCD() {
  if (!lcdInitialized) return;

  switch (currentLcdScreen) {
    case 0: renderScreen0(); break;
    case 1: renderScreen1(); break;
    case 2: renderScreen2(); break;
    case 3: renderScreen3(); break;
    case 4: renderScreen4(); break;
    default: currentLcdScreen = 0; renderScreen0(); break;
  }
}

// Screen 0: Temperature & Humidity
void renderScreen0() {
  char line1[17];
  char line2[17];
  float t = telemetry.dhtValid ? telemetry.temperatureDHT : (telemetry.bmpValid ? telemetry.temperatureBMP : 0.0f);
  float h = telemetry.dhtValid ? telemetry.humidityDHT : 0.0f;

  snprintf(line1, sizeof(line1), "Temp: %4.1f%cC   ", t, 223); // 223 is degree symbol in HD44780
  snprintf(line2, sizeof(line2), "Hum : %4.1f%%   ", h);

  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// Screen 1: Barometric Pressure & Air Quality
void renderScreen1() {
  char line1[17];
  char line2[17];
  float p = telemetry.bmpValid ? telemetry.pressureHPa : 0.0f;
  int   aq = telemetry.airQualityRaw;

  snprintf(line1, sizeof(line1), "Press:%5.0fhPa ", p);
  snprintf(line2, sizeof(line2), "AirQ : %-4d ADC ", aq);

  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// Screen 2: DC Bus Voltage & Fan Status
void renderScreen2() {
  char line1[17];
  char line2[17];
  const char* fanStr = controls.lobbyFan ? "ON " : "OFF";

  snprintf(line1, sizeof(line1), "Volt: %4.1fV    ", telemetry.busVoltage);
  snprintf(line2, sizeof(line2), "Fan : %-3s [Spd:%d]", fanStr, controls.lobbyFanSpeed);

  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// Screen 3: Lobby Light & TV Relays
void renderScreen3() {
  char line1[17];
  char line2[17];
  const char* lightStr = controls.lobbyLight ? "ON " : "OFF";
  const char* tvStr    = controls.lobbyTV    ? "ON " : "OFF";

  snprintf(line1, sizeof(line1), "Light: %-3s      ", lightStr);
  snprintf(line2, sizeof(line2), "TV   : %-3s      ", tvStr);

  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// Screen 4: Refrigerator & WiFi Status
void renderScreen4() {
  char line1[17];
  char line2[17];
  const char* fridgeStr = controls.refrigerator ? "ON " : "OFF";
  bool wifiOk = (WiFi.status() == WL_CONNECTED);

  snprintf(line1, sizeof(line1), "Fridge: %-3s     ", fridgeStr);
  if (wifiOk) {
    snprintf(line2, sizeof(line2), "WiFi  : OK %3ddB", WiFi.RSSI());
  } else {
    snprintf(line2, sizeof(line2), "WiFi  : OFFLINE ");
  }

  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// =================================================================================
//  22. SYSTEM DIAGNOSTIC PRINTER
// =================================================================================
void printSystemStatus() {
  Serial.println();
  Serial.println(F("================================"));
  Serial.println(F("       IoTMesh Node Status      "));
  Serial.println(F("================================"));
  Serial.printf("WiFi Status    : %s\n", (WiFi.status() == WL_CONNECTED) ? "CONNECTED" : "OFFLINE");
  Serial.printf("Firebase Stream: %s\n", firebaseStreamActive ? "ACTIVE" : "INACTIVE");
  Serial.printf("LCD 16x2 Display: %s\n", lcdInitialized ? "ONLINE (0x27)" : "NOT FOUND");
  Serial.printf("BMP180 Barometer: %s\n", bmpInitialized ? "ONLINE (0x77)" : "NOT FOUND");
  Serial.printf("DHT11 Sensor   : %s\n", telemetry.dhtValid ? "VALID" : "PENDING");
  Serial.printf("MQ135 Gas Raw  : %d ADC\n", telemetry.airQualityRaw);
  Serial.printf("DC Voltage In  : %.2f V\n", telemetry.busVoltage);
  Serial.printf("Relay Driver   : %s\n", pcf8574Available ? "PCF8574 @ 0x20" : "OFFLINE");
  Serial.println(F("================================"));
}
