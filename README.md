# IoTMesh — Complete System Specification & Technical Documentation

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-RTDB_12.6.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32_%7C_ESP8266_%7C_Arduino-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)

> **IoTMesh** is an end-to-end distributed Smart Home Automation, Environmental Telemetry, Remote Security, and Industrial Hardware Management Platform. It bridges multi-node edge microcontrollers (**ESP32**, **ESP8266**, and **Arduino Nano**) to an ultra-low-latency **Firebase Realtime Database (RTDB)** cloud infrastructure, a **Node.js** event-driven backend, and a reactive Single Page Application (SPA).

---

## 📑 Table of Contents

- [1. System Architecture & Topology](#1-system-architecture--topology)
- [2. Complete Feature Catalog](#2-complete-feature-catalog)
  - [2.1 Live Environmental Telemetry & Watchdog](#21-live-environmental-telemetry--watchdog)
  - [2.2 Smart Actuator & Multi-Speed Modulation](#22-smart-actuator--multi-speed-modulation)
  - [2.3 Rule-Based Automation Engine](#23-rule-based-automation-engine)
  - [2.4 High-Voltage Safety Ignition System](#24-high-voltage-safety-ignition-system)
  - [2.5 OTA Firmware Release & Rollback Pipeline](#25-ota-firmware-release--rollback-pipeline)
  - [2.6 Security, Dynamic Key Rotation & Telegram 2FA](#26-security-dynamic-key-rotation--telegram-2fa)
  - [2.7 Telegram Bot Integration & Alert Dispatcher](#27-telegram-bot-integration--alert-dispatcher)
  - [2.8 Timeseries Analytics & Dual-Sensor Graphing](#28-timeseries-analytics--dual-sensor-graphing)
  - [2.9 Web Audio Synthetic Sound Engine & Haptics](#29-web-audio-synthetic-sound-engine--haptics)
- [3. User Roles, Security & Inactivity Management](#3-user-roles-security--inactivity-management)
- [4. Firebase Realtime Database Complete Schema](#4-firebase-realtime-database-complete-schema)
- [5. Physical Hardware & Embedded Integration](#5-physical-hardware--embedded-integration)
- [6. Application Pages & Navigation Routes](#6-application-pages--navigation-routes)
- [7. Environment Variables Configuration](#7-environment-variables-configuration)
- [8. Installation, Local Development & Deployment](#8-installation-local-development--deployment)
- [9. Backend API & Microservices](#9-backend-api--microservices)
- [10. Website Rebuild & Parity Checklist](#10-website-rebuild--parity-checklist)

---

## 1. System Architecture & Topology

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     IoTMesh Ecosystem                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
          ▲                                         ▲                               ▲
          │ HTTPS / WSS                             │ Realtime Sync                 │ Webhooks / API
┌─────────┴────────────────────────┐    ┌───────────┴───────────────────────┐   ┌───┴─────────────────────────────┐
│       Web Client Application     │    │     Firebase Cloud Realtime DB    │   │      Render Node.js Backend     │
│ • React 18 + TypeScript + Vite   │    │  • home/room1/sensor (Telemetry)  │   │ • Event Listener & Dispatcher   │
│ • Web Audio Synthesis Soundscape │    │  • home/room1/controls (States)   │   │ • Telegram Bot API Engine       │
│ • Web Vibration Haptic Feedback  │    │  • home/room1/alerts/logs (Logs)  │   │ • GitHub Releases OTA Publisher │
│ • Recharts Historical Analytics  │    │  • home/room1/automations (Rules) │   │ • 2FA OTP Code Generator        │
│ • Role-Based Protected Routes    │    │  • security/passwords (Overrides) │   │ • Background Health Monitor     │
└──────────────────────────────────┘    └───────────┬───────────────────────┘   └─────────────────────────────────┘
                                                    │
                                                    │ WiFi (HTTP REST / RTDB Streaming)
                                        ┌───────────┴───────────────────────┐
                                        │       Hardware & Edge Layer       │
                                        │  • ESP32 Main / Lobby Hub         │
                                        │  • ESP8266 Auxiliary Room Nodes   │
                                        │  • Arduino Nano Analog Bridge     │
                                        │  • Sensors, Relays & Actuators    │
                                        └───────────────────────────────────┘
```

### High-Level Data Flow:
1. **Sensors → ESP → Firebase:** Microcontrollers sample analog and digital sensors (DHT11, BMP180, MQ135, HC-SR04, Rain, PIR, Door reed switch, Power sensor, Voltage divider) and stream JSON payloads to `home/room1/sensor`.
2. **Firebase → Web Client:** The React web app establishes real-time WebSocket listeners (`onValue`) on `home/room1/sensor` to update UI dials, badges, and charts with sub-second latency.
3. **Web Client → Firebase → ESP (Actuation):** Toggling a light, fan, relay, or lock writes to `home/room1/controls`. Connected ESP nodes receive the delta instantly and toggle their GPIO pins.
4. **Firebase → Backend → Telegram:** Critical threshold breaches (`GAS`, `DOOR`, `POWER`, `BATT`, `IGNITION`) trigger backend event handlers to broadcast rich markdown alerts to registered Telegram subscribers.

---

## 2. Complete Feature Catalog

### 2.1 Live Environmental Telemetry & Watchdog
* **11 Core Telemetry Metrics:**
  * **DHT11 Ambient Temperature:** Displayed in °C with adaptive color coding (`<25°C` cold, `<35°C` ok, `<40°C` warning, `≥40°C` alert).
  * **BMP180 Barometric Temperature:** Secondary high-precision thermal measurement in °C.
  * **Average Temperature:** Computed arithmetic mean `(DHT11 + BMP180) / 2`.
  * **Relative Humidity:** Measured in `%` (`<30%` or `>70%` warning).
  * **Air Quality Index (MQ135 Gas):** Measured in PPM (`>350` alert, `>250` warning, `≤250` ok).
  * **Atmospheric Pressure:** Measured in `hPa` from the BMP180 sensor.
  * **Water Tank Level:** Ultrasonic distance measurement via HC-SR04 in `cm` (`>60cm` ok, `>20cm` warning, `≤20cm` alert).
  * **Rain Detector:** Binary boolean state (`"Detected"` red alert vs `"Clear"` green ok).
  * **PIR Motion Sensor:** Infrared presence detection (`"Detected"` amber warning vs `"Clear"` ok).
  * **Magnetic Door Sensor:** Numeric flag (`1 = "Open"` amber warning vs `0 = "Closed"` green ok).
  * **Barometric Weather Forecasting:** Displays pressure trend delta (`+0.42 hPa/sample`) and predictive forecast string (`"Rising (Clear)"`, `"Falling (Rain)"`, `"Stable"`).
* **Hardware Watchdog Liveness Calculation:**
  * Evaluates timestamp string `last_update` (`"HH:mm:ss DD-MM-YYYY"`).
  * Compares delta against current time: `diff = Date.now() - lastUpdateEpochMs`.
  * If `diff <= 120,000 ms` (2 minutes): Flags device as **LIVE** with a pulsating green indicator.
  * If `diff > 120,000 ms`: Flags device as **OFFLINE** with a red indicator and relative age counter (`XXs ago`, `XXm ago`, or `XXh ago`).
* **Power & Energy Subsystem:**
  * Detects source: `1 = "Grid ⚡"` (green) vs `0 = "Inverter 🔋"` (amber).
  * Computes Battery Percentage (`%`) and Terminal Voltage (`V`) with three-tier health status (`>60%` green, `>30%` amber, `≤30%` red).

---

### 2.2 Smart Actuator & Multi-Speed Modulation
* **Multi-Room Actuator Grid:**
  * **Room 1, Room 2, Room 3:** Discrete switching for Lights, Auxiliary Switches, and Ceiling Fans.
  * **Common Areas:** Lobby Fan, Lobby Light, TV, Refrigerator.
  * **Relay Actuation Bank:** Discrete switching of 4 independent relay channels (`relay1` to `relay4`).
* **4-Speed Fan Modulation Slider:**
  * Interactive step slider supporting states: `0 = Off`, `1 = Low`, `2 = Medium`, `3 = High`.
  * Real-time CSS keyframe animation dynamically scales SVG fan rotation duration (`1.2s`, `0.6s`, `0.25s`).
  * Emits tactile haptic ticks and synthetic clicks on each speed increment.
* **Global Scene Shortcuts:**
  * **All OFF:** Turns off all 17 lights, fans, switches, and relays simultaneously in a single atomic multi-path update while preserving security lock states.
  * **Night Mode:** Activates global lockdown (`{ nightMode: true, lock: true, motion: true }`). Prevents accidental door unlocks until Night Mode is explicitly disarmed.
  * **Day Mode:** Disarms perimeter lockdown (`{ nightMode: false, lock: false, motion: false }`).
* **Role-Guarded Security Passkey Interlock:**
  * **Admin:** Instant direct door lock toggle.
  * **Guest:** Intercepts action and presents a modal requiring master security password verification (`VITE_SECURITY_PASSWORD` or `security/passwords/securityPassword`) before permitting actuation.

---

### 2.3 Rule-Based Automation Engine
* **Visual Condition-Action Builder:** Create custom IF/THEN automation rules stored in `home/room1/automations/{ruleId}`.
* **Condition Engine:**
  * Monitored Sensors: Temperature, Humidity, Gas PPM, Pressure, Water Level, Rain, Motion, Door, Power Source.
  * Supported Operators: `>`, `<`, `>=`, `<=`, `==`, `!=`.
  * Humanized Boolean Mapping: Automatically translates boolean flags (`rain`, `motion`, `door`) to `"Detected / Open"` vs `"Clear / Closed"` and Power to `"Grid ⚡"` vs `"Inverter 🔋"`.
* **Action Engine:** Any rule can trigger discrete `"Turn ON"` or `"Turn OFF"` commands across any of the 18 appliances and relays.
* **Continuous Client-Side Daemon:** Active React evaluation hook monitors incoming telemetry in real-time, evaluates all active rules, and automatically executes target device state updates when all conditions in a rule are met.

---

### 2.4 High-Voltage Safety Ignition System
* **Purpose:** Multi-stage safety interlock controller for high-voltage ignition systems.
* **Security Pipeline:**
  1. **Admin Role Requirement:** Guests receive a disabled UI with an unauthorized warning.
  2. **Passcode Arming:** Admin enters `VITE_ARM_PASSWORD` (or `security/passwords/armPassword`) to transition system to **ARMED** state (accompanied by `sounds.arm()` and `haptic.armed()`).
  3. **5-Second Continuous Physical Hold:** Admin must hold down the ignition button for 5 continuous seconds. Each second increments charging progress bar and triggers audio ticks. Releasing before 5 seconds instantly aborts the charge.
  4. **Active Fire & Automated Reset Sequence:**
     * Reaching 5 seconds triggers acoustic rumble (`sounds.ignitionFire()`) and fires heavy vibration haptics.
     * Sets Firebase path `special/ignition = 1`.
     * Initiates a 3-second visual countdown with pitch-elevated beeps.
     * At 0 seconds, automatically resets `special/ignition = 0`, plays completion chime, and displays toast `"Ignition complete"`.

---

### 2.5 OTA Firmware Release & Rollback Pipeline
* **Binary Upload Portal:** Admin interface supporting `.bin` firmware builds up to 16 MB for **ESP32** and **ESP8266**.
* **Automated GitHub Release Publishing:**
  * Front-end submits multipart FormData to Node.js backend endpoint `/api/firmware/upload`.
  * Backend programmatically uploads the asset to **GitHub Releases**, retrieves the immutable raw CDN binary download URL, writes release metadata to `ota/latest`, and writes an active deployment trigger to `ota/current`.
* **Microcontroller OTA Ingestion:** Connected ESPs monitoring `ota/current` or `ota/latest` download the new binary over HTTPS and flash their flash partitions via ESP-HTTP-OTA.
* **Version Management:**
  * **Re-Trigger OTA:** One-click re-deployment of previous historical firmware builds from `ota/history`.
  * **Cancel OTA:** Aborts an in-progress deployment by purging `ota/current`.
  * **Delete Record:** Cleans up metadata from `ota/history` while keeping GitHub releases intact.

---

### 2.6 Security, Dynamic Key Rotation & Telegram 2FA
* **In-Memory Cloud Password Overrides:** Admin can rotate any system password in real-time by writing to `security/passwords` in Firebase RTDB:
  * `guestPassword` (Overrides `VITE_GUEST_PASSWORD_New`)
  * `adminPassword` (Overrides `VITE_ADMIN_PASSWORD`)
  * `armPassword` (Overrides `VITE_ARM_PASSWORD`)
  * `securityPassword` (Overrides `VITE_SECURITY_PASSWORD`)
* **Telegram 2FA OTP Reset Flow:**
  1. Clicking "Forgot Password" writes a request object to `security/otp` (`{ requested: true, targetKey, timestamp }`).
  2. Backend generates a 6-digit numeric OTP with 5-minute expiry (`expiresAt`), saves it to Firebase, and sends an urgent Telegram message to the admin's Telegram Chat ID.
  3. Admin enters the 6 digits into an `InputOTP` segmented slot field.
  4. Upon verification, the OTP is purged and the admin is permitted to set a new password.

---

### 2.7 Telegram Bot Integration & Alert Dispatcher
* **Bot Onboarding:** Users scan a QR code linking to the IoTMesh Telegram Bot and send `/start` to obtain their unique numeric `chatId`.
* **Subscription Management:** Users register Name + Chat ID to `telegram/subscribers/list/{index}`, with atomic autoincrementing index handling via `telegram/subscribers/meta/nextIndex`.
* **Bot Remote Commands:**
  * `/status` — Queries live sensor readings and node health.
  * `/on <device>` & `/off <device>` — Toggles relays and appliances remotely.
  * `/logins` — Returns recent authentication audit logs.
* **Event-Driven Alert Broadcasting:** Backend automatically broadcasts formatted alerts to all subscribers when critical thresholds are reached (e.g., Gas leak, Door breach, Power source change, Low battery, Ignition active).

---

### 2.8 Timeseries Analytics & Dual-Sensor Graphing
* **Historical Telemetry Log:** Ingests timeseries data from `home/room1/history/h24`.
* **Dynamic Range Filtering:** Visualizes `1h`, `12h`, and `24h` sliding time windows.
* **Composite Chart Visualizations:**
  * **Dual Temperature Chart:** Simultaneous overlay of DHT11 (solid red line + red gradient area) vs BMP180 (orange line + orange gradient area) with custom dual hover tooltips.
  * **Dual Battery Subsystem Chart:** Left Y-axis renders Battery Percentage `0-100%` (green area); Right Y-axis renders Terminal Voltage `3.0V - 4.3V` (light green dashed line).
  * **Individual Metric Area Charts:** Humidity (sky blue), Air Quality (emerald green), Pressure (amber), Water Level (indigo).
* **Live Statistical Aggregations:** Computes real-time Minimum, Maximum, and Average values across the selected time range.

---

### 2.9 Web Audio Synthetic Sound Engine & Haptics
IoTMesh generates all sound effects procedurally via the **Web Audio API** with zero external audio assets, paired with tactile feedback via the **Web Vibration API**:

```
┌───────────────────┬─────────────────────────────────────────────────────────────┬─────────────────────────────────┐
│ Event / Action    │ Synthetic Waveform & Pitch Sequence                         │ Tactile Vibration Pattern       │
├───────────────────┼─────────────────────────────────────────────────────────────┼─────────────────────────────────┤
│ System Armed      │ Ascending square wave: 440Hz → 660Hz → 880Hz → 1100Hz       │ [80ms, 40ms, 80ms, 40ms, 80ms]  │
│ System Disarmed   │ Descending square drop: 660Hz → 330Hz                       │ 150ms single pulse              │
│ Wrong Passcode    │ Low dissonance sawtooth buzz: 180Hz → 160Hz → 140Hz         │ [100ms, 50ms, 100ms]            │
│ Hold Tick (1s)    │ Short high square click: 880Hz (50ms)                       │ 30ms light tap                  │
│ Hold Complete     │ Ascending triad: 1200Hz → 1400Hz → 1600Hz                   │ 200ms heavy pulse               │
│ Ignition Fire     │ Dual white noise burst + 80Hz/60Hz deep sawtooth sub rumble │ [300ms, 100ms, 300ms] rumble    │
│ Countdown Beep    │ 900Hz square beep (1400Hz high pitch on final second)       │ 60ms pulse (120ms on last sec)  │
│ Sequence Complete │ Major 7th harmonic chime: 523Hz, 659Hz, 784Hz, 1047Hz (C-E-G-C)│ 400ms sustained confirmation │
│ Switch Toggle ON  │ Sine chirp: 440Hz → 660Hz                                   │ 50ms light pulse                │
│ Switch Toggle OFF │ Sine chirp: 440Hz → 330Hz                                   │ 50ms light pulse                │
│ Critical Alarm    │ Alternating siren: 800Hz / 600Hz sawtooth                   │ [100ms, 40ms, 100ms, 40ms, 100ms]│
└───────────────────┴─────────────────────────────────────────────────────────────┴─────────────────────────────────┘
```

---

## 3. User Roles, Security & Inactivity Management

### Role-Based Access Control (RBAC)

| Page / Feature | Route | Guest Privilege | Admin Privilege | Unauthorized Behavior |
|---|---|---|---|---|
| **Landing Showcase** | `/iotmesh` | ✅ Full Access | ✅ Full Access | Publicly accessible |
| **Authentication** | `/auth` | ✅ Full Access | ✅ Full Access | Publicly accessible |
| **Telemetry Dashboard**| `/dashboard` | ✅ Full Access | ✅ Full Access | Redirect to `/auth` |
| **Device Controls** | `/devices` | ⚠️ Door Lock requires Passkey | ✅ Full Control | Passkey prompt modal on Lock |
| **Sensor Analytics** | `/sensors` | ✅ Full Access | ✅ Full Access | Redirect to `/auth` |
| **Alert Log** | `/alerts` | ✅ Full Access | ✅ Full Access | Redirect to `/auth` |
| **Telegram Setup** | `/telegram` | ✅ Subscribe Self | ✅ Subscribe Self | Redirect to `/auth` |
| **Automation Rules** | `/automation`| ✅ Create / Edit | ✅ Create / Edit | Redirect to `/auth` |
| **Ignition Control** | `/ignition` | 👁️ View Only (Controls Disabled)| ✅ Full Arm + Fire | UI shows "Admin Only" Banner |
| **User Directory** | `/users` | ❌ Restricted | ✅ View + Delete | Redirect to `/dashboard` + Toast |
| **Security Center** | `/security` | ❌ Restricted | ✅ Full Access | Redirect to `/dashboard` + Toast |
| **Firmware Updates** | `/firmware` | ❌ Restricted | ✅ Full Access | Redirect to `/dashboard` + Toast |

### Inactivity Auto-Logout
* **Timeout Window:** 30 minutes (`1,800,000 ms`).
* **Monitored Events:** `mousemove`, `keydown`, `click`, `scroll`, `touchstart`.
* **UI Counter:** Persistent countdown clock rendered in sidebar/navigation (`Auto logout in MM:SS`).
* **On Expiration:** Clears `localStorage` key `mock_user`, resets authentication context, plays `sounds.logout()`, triggers `haptic.heavy()`, and redirects to `/auth`.

---

## 4. Firebase Realtime Database Complete Schema

```json
{
  "home": {
    "room1": {
      "sensor": {
        "temperature": 28.4,
        "temperatureBMP": 28.1,
        "humidity": 58.0,
        "pressure": 1013.2,
        "gas": 184.0,
        "rain": false,
        "WaterLevel": 78.0,
        "motion": false,
        "door": 0,
        "power": 1,
        "batteryVolt": 4.12,
        "batteryPercent": 88,
        "timestamp": 1724667000000,
        "last_update": "12:30:00 26-08-2026"
      },
      "controls": {
        "room1Light": false,
        "room1Switch": false,
        "room1Fan": false,
        "room1FanSpeed": 0,
        "room2Light": false,
        "room2Switch": false,
        "room2Fan": false,
        "room2FanSpeed": 0,
        "room3Light": false,
        "room3Switch": false,
        "room3Fan": false,
        "room3FanSpeed": 0,
        "lobbyLight": false,
        "lobbyFan": false,
        "lobbyFanSpeed": 0,
        "lobbyTV": false,
        "refrigerator": false,
        "relay1": false,
        "relay2": false,
        "relay3": false,
        "relay4": false,
        "lock": false,
        "motion": false,
        "nightMode": false
      },
      "status": {
        "online": true,
        "lastSeen": 1724667000000
      },
      "weather": {
        "trend": 0.42,
        "prediction": "Rising (Clear Weather)",
        "latest_hpa": 1013.2,
        "oldest_hpa": 1011.1,
        "samples": 12,
        "updated_at": "12:30:00"
      },
      "history": {
        "h24": {
          "-OABC123": {
            "timestamp": 1724667000000,
            "temperature": 28.4,
            "temperatureBMP": 28.1,
            "humidity": 58.0,
            "gas": 184.0,
            "pressure": 1013.2,
            "waterLevel": 78.0,
            "batteryPercent": 88,
            "batteryVolt": 4.12
          }
        }
      },
      "alerts": {
        "logs": {
          "-OALR999": {
            "alert_type": "GAS",
            "severity": "critical",
            "message": "MQ Sensor triggered — emergency broadcast sent",
            "sensor_value": 380,
            "timestamp": 1724667000000
          }
        }
      },
      "automations": {
        "rule_abc123": {
          "id": "rule_abc123",
          "name": "Cool Room When Hot",
          "enabled": true,
          "conditions": [
            { "sensor": "temperature", "operator": ">", "value": "32" },
            { "sensor": "motion", "operator": "==", "value": "true" }
          ],
          "actions": [
            { "device": "room1Fan", "action": "on" },
            { "device": "relay1", "action": "on" }
          ]
        }
      }
    },
    "users": {
      "-OUSR111": {
        "name": "John Doe",
        "role": "admin",
        "timestamp": 1724667000000
      }
    }
  },
  "telegram": {
    "subscribers": {
      "meta": {
        "nextIndex": 3
      },
      "list": {
        "0": { "name": "Admin", "chatId": "987654321", "createdAt": 1724600000000 },
        "1": { "name": "Visitor", "chatId": "123456789", "createdAt": 1724610000000 }
      }
    }
  },
  "security": {
    "passwords": {
      "guestPassword": "custom_guest_pass",
      "adminPassword": "custom_admin_pass",
      "armPassword": "custom_arm_pass",
      "securityPassword": "custom_security_pass"
    },
    "otp": {
      "requested": false,
      "targetKey": "adminPassword",
      "code": "492815",
      "timestamp": 1724667000000,
      "expiresAt": 1724667300000
    }
  },
  "ota": {
    "current": {
      "active": true,
      "version": "2.2.0",
      "url": "https://github.com/anubhavb4123/IoTMesh/releases/download/v2.2.0/firmware.bin",
      "recordId": "rec_001",
      "fileName": "firmware_esp32_v2.2.0.bin",
      "fileSize": 1458920,
      "timestamp": 1724667000000,
      "board": "ESP32"
    },
    "latest": {
      "version": "2.2.0",
      "firmware_url": "https://github.com/anubhavb4123/IoTMesh/releases/download/v2.2.0/firmware.bin",
      "board": "ESP32",
      "release_notes": "Added sensor drift compensation",
      "uploaded_at": 1724667000000
    },
    "history": {
      "rec_001": {
        "id": "rec_001",
        "fileName": "firmware_esp32_v2.2.0.bin",
        "fileSize": 1458920,
        "version": "2.2.0",
        "notes": "Added sensor drift compensation",
        "board": "ESP32",
        "uploadedAt": 1724667000000,
        "uploadedBy": "John Doe",
        "status": "deployed",
        "firmwareUrl": "https://github.com/anubhavb4123/IoTMesh/releases/download/v2.2.0/firmware.bin"
      }
    }
  },
  "special": {
    "ignition": 0
  }
}
```

---

## 5. Physical Hardware & Embedded Integration

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Hardware Component Map                                       │
├────────────────────┬──────────────┬────────────────────────┬───────────────────────────────────┤
│ Component          │ Category     │ Communication Bus      │ Functional Role                   │
├────────────────────┼──────────────┼────────────────────────┼───────────────────────────────────┤
│ ESP32              │ Controller   │ WiFi / BLE → Firebase  │ Primary dual-core IoT hub         │
│ ESP8266 NodeMCU    │ Controller   │ WiFi → Firebase        │ Auxiliary room node controller    │
│ Arduino Nano       │ Co-processor │ UART / I2C Bridge      │ Analog sensor & ADC expander      │
│ DHT11 / DHT22      │ Sensor       │ 1-Wire Digital GPIO    │ Temperature & humidity telemetry  │
│ BMP180             │ Sensor       │ I2C Bus (SDA/SCL)      │ Barometric pressure & weather     │
│ MQ135 Gas Sensor   │ Sensor       │ Analog ADC Input       │ Combustible gas & air quality PPM │
│ HC-SR04 Ultrasonic │ Sensor       │ Trigger / Echo Digital │ Water tank distance sensing in cm │
│ Rain Detection PCB │ Sensor       │ Analog / Digital GPIO  │ Precipitation detection           │
│ PIR Motion Sensor  │ Sensor       │ Digital Interrupt GPIO │ Infrared human presence detection │
│ Magnetic Reed Sw.  │ Sensor       │ Digital Pull-Up GPIO   │ Perimeter door open/close sensing │
│ ACS712 & Divider   │ Power        │ Analog ADC Input       │ AC Current & Battery DC Voltage   │
│ DS3231 RTC Module  │ Timing       │ I2C Bus (SDA/SCL)      │ Real-time clock for local logging │
│ 4-Channel Relays   │ Actuator     │ Digital Optocoupled    │ AC appliance & load switching     │
│ High-Torque Servo  │ Actuator     │ PWM Signal             │ Motorized deadbolt door lock      │
│ Piezo Buzzer       │ Safety       │ Digital PWM            │ Audible alarm on gas/intrusion    │
└────────────────────┴──────────────┴────────────────────────┴───────────────────────────────────┘
```

---

## 6. Application Pages & Navigation Routes

```
┌──────────────────┬─────────────────────────────┬──────────────────────┬───────────────────────────────┐
│ Page Title       │ Component File              │ Route Path           │ Access Permission             │
├──────────────────┼─────────────────────────────┼──────────────────────┼───────────────────────────────┤
│ Public Showcase  │ src/pages/IotMeshA.tsx      │ /iotmesh             │ Public (Unauthenticated)      │
│ Authentication   │ src/pages/Auth.tsx          │ /auth (Default /)    │ Public (Unauthenticated)      │
│ Telemetry Panel  │ src/pages/Dashboard.tsx     │ /dashboard           │ Authenticated (Guest & Admin) │
│ Device Controls  │ src/pages/Devices.tsx       │ /devices             │ Authenticated (Guest & Admin) │
│ Sensor Analytics │ src/pages/Sensors.tsx       │ /sensors             │ Authenticated (Guest & Admin) │
│ Alert Log        │ src/pages/Alerts.tsx        │ /alerts              │ Authenticated (Guest & Admin) │
│ Telegram Bot     │ src/pages/Telegram.tsx      │ /telegram            │ Authenticated (Guest & Admin) │
│ Rule Automation  │ src/pages/Automation.tsx    │ /automation          │ Authenticated (Guest & Admin) │
│ Ignition Panel   │ src/pages/IgnitionControl.tsx│ /ignition           │ Authenticated (Admin Only UI) │
│ User Directory   │ src/pages/Users.tsx         │ /users               │ Admin Only                    │
│ Security Center  │ src/pages/Security.tsx      │ /security            │ Admin Only                    │
│ Firmware Updates │ src/pages/FirmwareUpdate.tsx│ /firmware            │ Admin Only                    │
│ 404 Error Screen │ src/pages/NotFound.tsx      │ * (Catch-all)        │ Public                        │
└──────────────────┴─────────────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 7. Environment Variables Configuration

Create a `.env` file in the root directory:

```env
# ── Firebase Cloud Credentials ────────────────────────────────────────
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://your_project_id-default-rtdb.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id"

# ── Authentication & Security Default Passkeys ────────────────────────
VITE_GUEST_PASSWORD="legacy_password_triggering_update_notice"
VITE_GUEST_PASSWORD_New="valid_guest_access_key"
VITE_ADMIN_PASSWORD="master_admin_passkey"
VITE_ARM_PASSWORD="arm_ignition_passkey"
VITE_SECURITY_PASSWORD="door_lock_master_passkey"

# ── Backend Microservice API ──────────────────────────────────────────
VITE_BACKEND_URL="http://localhost:3001"
```

---

## 8. Installation, Local Development & Deployment

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **Package Manager:** `npm`, `yarn`, or `bun`

### Setup & Run Locally
```bash
# 1. Clone repository
git clone https://github.com/anubhavb4123/IoTMesh.git
cd IoTMesh

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Access the web app at http://localhost:5173
```

### Production Build & Preview
```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

### Firebase Hosting Deployment
```bash
# Deploy compiled bundle to Firebase Hosting
firebase deploy --only hosting
```

---

## 9. Backend API & Microservices

The front-end integrates with an external Node.js event-driven backend (`VITE_BACKEND_URL`):

* **Firmware Multipart Upload (`POST /api/firmware/upload`):**
  * Receives `multipart/form-data` containing `file` (`.bin`), `version`, `board`, `notes`, `uploadedBy`.
  * Uploads binary asset to GitHub Releases repository.
  * Writes release CDN download URL to Firebase `ota/latest` and `ota/current`.
  * Returns JSON payload `{ success: true, version, board, url }`.
* **Telegram 2FA OTP Daemon:** Monitors `security/otp`, dispatches 6-digit OTP codes via Telegram Bot API, and enforces 5-minute expirations.
* **Alert Broadcast Engine:** Listens to `home/room1/alerts/logs` and pushes markdown notifications to all registered subscriber chat IDs in `telegram/subscribers/list`.

---

## 10. Website Rebuild & Parity Checklist

When rebuilding the web application with a brand-new UI, ensure the following requirements are met to guarantee 100% functional parity:

- [ ] **Dual-Stage Authentication:** Step 1 Access Key check + Step 2 Admin passkey or Guest access.
- [ ] **Dynamic Key Overrides:** Prioritize `security/passwords` from Firebase over `.env` defaults.
- [ ] **Inactivity Auto-Logout:** Enforce a 30-minute idle timer with activity reset.
- [ ] **Live Telemetry Parsing:** Subscribe to `home/room1/sensor` and parse all 11 sensor readings.
- [ ] **120-Second Liveness Watchdog:** Automatically switch LIVE/OFFLINE status badges based on `last_update`.
- [ ] **Weather Prediction Trend:** Render barometric forecast string and `hPa/sample` delta from `home/room1/weather`.
- [ ] **Power Subsystem:** Correctly distinguish Grid (`power === 1`) vs Inverter (`power === 0`) and format battery `%` and `V`.
- [ ] **Appliance Switching:** Support discrete toggles for Lights, Switches, and Fans across all rooms.
- [ ] **4-Speed Fan Modulation:** Implement 4-state fan speed step controls (`0, 1, 2, 3`).
- [ ] **Relay Actuation:** Provide discrete control for `relay1`, `relay2`, `relay3`, and `relay4`.
- [ ] **Scene Shortcuts:** Implement "All OFF" (preserving locks), "Night Mode" lockdown, and "Day Mode".
- [ ] **Guest Lock Modal:** Intercept guest door lock toggles and require security password entry.
- [ ] **Timeseries Analytics:** Graph 1h, 12h, and 24h ranges from `home/room1/history/h24`.
- [ ] **Composite Graphs:** Render dual temperature curves (DHT11 + BMP180) and dual battery graphs (% Area + Voltage Line).
- [ ] **Statistical Aggregations:** Calculate live Min, Max, and Average values for active chart windows.
- [ ] **Diagnostic Alert Log:** Render logs from `home/room1/alerts/logs` with category filters.
- [ ] **Telegram Subscriber Registry:** Allow saving subscribers with autoincrementing index under `telegram/subscribers/list`.
- [ ] **Automation Engine:** Visual IF/THEN builder saving to `home/room1/automations` with active client evaluation.
- [ ] **Ignition Safety Interlock:** Enforce Admin role, Arm Passcode check, 5-second physical hold, and 3-second auto-reset.
- [ ] **Dynamic Password Rotation:** Allow admins to update credentials directly in `security/passwords`.
- [ ] **Telegram 2FA OTP Reset:** Request OTP, receive code via Telegram, verify 6 digits, and update password.
- [ ] **OTA Firmware Upload:** Send `.bin` uploads to backend API and update `ota/latest` and `ota/current`.
- [ ] **OTA Rollback & Cancel:** Allow re-triggering historical firmware builds and canceling active rollouts.
- [ ] **User & Subscriber Management:** Admin controls to delete login history and remove Telegram subscribers.
- [ ] **Synthetic Audio Feedback:** Implement Web Audio API synthesis for all 11 sound effects.
- [ ] **Tactile Vibration Engine:** Implement Web Vibration API patterns for mobile touch feedback.
- [ ] **Route Protection:** Protect `/users`, `/security`, and `/firmware` for Admin role only.

---

## 📄 License & Maintainer

* **Maintainer:** Anubhav Bajpai  
* **Email:** [anubhavb4123@gmail.com](mailto:anubhavb4123@gmail.com)  
* **GitHub:** [@anubhavb4123](https://github.com/anubhavb4123)  
* **Website:** [https://iotmesh-4123.web.app](https://iotmesh-4123.web.app)  
* **License:** Licensed under the [MIT License](LICENSE).
