# IoTMesh: Distributed Edge-Resilient IoT Architecture, Real-Time Environmental Telemetry & Multi-Tier Safety Platform

**Project Grant Application & Comprehensive Technical Dossier**  
*Document Version:* 2.4.0 | *Status:* Active Prototype & Field Validated (TRL 6)  
*Principal Investigator / Lead System Architect:* Anubhav Bajpai  
*Official Repository:* [github.com/anubhavb4123/IoTMesh](https://github.com/anubhavb4123/IoTMesh)  
*Live Cloud Dashboard:* [iotmesh-4123.web.app](https://iotmesh-4123.web.app)  
*Contact:* [anubhavb4123@gmail.com](mailto:anubhavb4123@gmail.com)  

---

## Executive Summary

The global Internet of Things (IoT) landscape is overwhelmingly polarized between **cost-prohibitive, closed-ecosystem industrial automation** and **fragile, consumer-grade smart devices**. Existing commercial platforms suffer from critical vulnerabilities: mandatory reliance on continuous internet connectivity, vendor cloud lock-in, sluggish latency (often exceeding 2–5 seconds per actuation), lack of local edge fail-safes, and absence of mission-critical safety interlocks. When connectivity fails in modern smart environments, appliances become unresponsive, sensors go dark, and critical safety hazards—such as combustible gas leaks or perimeter breaches—go unnoticed.

**IoTMesh** is an open, modular, distributed IoT and Edge-Computing Platform engineered to eliminate these points of failure. By combining **heterogeneous multi-microcontroller edge nodes (ESP32, ESP32-C3, ESP8266, Arduino Nano)** with an **ultra-low-latency Firebase Realtime Database (RTDB) sync layer**, an **event-driven cloud microservice engine**, and an **uncompromising local-first fallback architecture**, IoTMesh guarantees:

1. **100% Autonomous Offline Survivability:** Physical rocker switches and local sensor triggers execute with zero latency (<5ms) directly on edge hardware, completely independent of router, Wi-Fi, or cloud status.
2. **Sub-Second Bidirectional Cloud Telemetry:** When connected, live environmental vitals across 11 parameters stream bidirectionally at sub-second intervals (<300ms round-trip latency).
3. **Multi-Stage Safety Interlocks:** Incorporates high-voltage ignition safety controls with 5-second continuous physical hold validation, automatic MQ135 combustible gas cutoff, and automated Telegram emergency broadcasting.
4. **Universal Hardware Interoperability:** Bridges legacy AC electrical wiring and modular switchboards to digital cloud infrastructure without requiring destructive rewiring.

IoTMesh addresses critical societal, environmental, and infrastructure challenges spanning **energy efficiency, disaster prevention, water conservation, and accessible smart infrastructure** for developing economies. This proposal outlines the problem space, technological innovation, architecture, current developmental readiness (TRL 6), social impact, and budget allocation for grant funding.

---

## 1. Problem Statement & Market Deficiencies

Despite multi-billion-dollar investments in the IoT domain, current systems fail in environments characterized by intermittent network infrastructure, extreme weather, and non-standard electrical grids (common across India and emerging economies).

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             CRITICAL SYSTEM DEFICIENCIES IN MODERN IOT                           │
├────────────────────────────────────────┬─────────────────────────────────────────────────────────┤
│ Existing Market Failure                │ IoTMesh Engineering Solution                            │
├────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 1. Cloud-Dependency & "Bricked" Nodes  │ True Local-First Edge Architecture                      │
│ When the internet drops, conventional  │ Hardware GPIO relays switch instantly on edge MCUs;     │
│ smart bulbs, switches, and valves fail │ local EEPROM states preserve synchronization.           │
├────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 2. High Latency & Proprietary Clouds   │ Sub-Second Open Web-Sockets & RTDB                      │
│ Proprietary vendor clouds introduce    │ Direct Firebase RTDB streaming ensures <300ms latency   │
│ 1.5s to 5.0s actuation delays.         │ across global web, mobile, and hardware clients.        │
├────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 3. Destructive Rewiring & High Costs   │ Non-Invasive Retrofit Micro-Modules                     │
│ Industrial automation requires total   │ Compact modules fit behind standard wall switchboards;  │
│ rewiring ($1000s per installation).    │ existing physical switches maintain full control.       │
├────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 4. Ignored Environmental Telemetry     │ 11-Parameter Integrated Sensor Fusion                   │
│ Home setups rarely monitor power grid  │ Real-time tracking of Gas, Pressure, Rain, Water,       │
│ health, air quality, or water storage. │ Temp, Humidity, Motion, Door, and Grid/Inverter source. │
├────────────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 5. Lack of High-Voltage Safety Locks   │ Cryptographic & Timed Safety Interlocks                 │
│ Smart switches treat a 15W lightbulb   │ Multi-stage arming, physical touch hold, and countdown  │
│ the same as a hazardous high-load coil.│ auto-reset prevent accidental heavy equipment firing.   │
└────────────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

### Detailed Problem Domains:

- **The "Cloud Blackout" Bottleneck:** In emerging economies and industrial perimeters, broadband dropout rates range from 5% to 20% daily. Most commercial smart home platforms (Tuya, eWeLink, SmartLife) route switch presses through overseas cloud servers before returning a command to the local bulb. If the internet drops, users cannot even turn on their lights.
- **Water Scarcity & Overflow Waste:** Hundreds of millions of urban households rely on rooftop water tanks fed by municipal or groundwater pumps. Lack of continuous, automated level telemetry results in severe pump burnouts, daily water overflows, and massive energy waste.
- **Gas Leaks & Fire Hazards in Domestic/Laboratory Environments:** LPG and methane leaks frequently escalate into deadly explosions because basic sensors lack automated relay cutoffs and failsafe alert dispatchers that notify users outside the premises.
- **Power Grid Volatility & Inverter Degradation:** Developing world microgrids alternate between Grid Mains and Inverter/Battery backups multiple times per day. Smart devices rarely recognize whether the household is running on high-capacity grid power or scarce battery reserves, resulting in battery depletion during blackouts.

---

## 2. The IoTMesh Technological Solution

IoTMesh is engineered from the ground up as a **Decentralized, Resilient, Distributed Edge-Mesh System**. It operates across three tightly integrated tiers:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 IOTMESH FULL ARCHITECTURE TOPOLOGY                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

 ═════════════════════════════  TIER 1: CLIENT & PRESENTATION LAYER  ═════════════════════════════
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │ • Single Page Application (React 18 + TypeScript + Vite + TailwindCSS)                   │
   │ • Real-time Interactive SVG Graphics (Animated 4-Speed Fan Modulator)                    │
   │ • Web Audio Procedural Synthesis (11 Hardware-Free Synthesized Tones)                    │
   │ • Web Vibration API Tactile Haptic Patterns                                              │
   │ • Timeseries Telemetry Visualization (Recharts Dual-Axis Sensor Historical Curves)       │
   │ • Role-Based Protected Routes (Admin Privileges vs Guest Restrictions)                   │
   │ • Persistent Inactivity Watchdog (30-minute auto-logout with active user session reset)   │
   └──────────────────────────────────────────────────────────────────────────────────────────┘
                                             ▲                                  ▲
                         Sub-Second WebSocket│                      REST / API  │
                                             ▼                                  ▼
 ══════════════════════════════  TIER 2: CLOUD & MICROSERVICES LAYER  ═════════════════════════════
   ┌────────────────────────────────────────┐        ┌────────────────────────────────────────┐
   │ Firebase Realtime Database (RTDB)      │        │ Node.js Event Engine (Render Cloud)    │
   │ • Single Source of Truth               │◄──────►│ • Continuous Telemetry Threshold Eval  │
   │ • /home/sensor (11 metrics)            │        │ • Telegram Bot API Integration         │
   │ • /home/room1/controls (Device states) │        │ • Automated Broadcast Alert Dispatcher │
   │ • /security/passwords (Cloud overrides)│        │ • 2FA OTP Generation & Invalidation    │
   │ • /ota (Firmware distribution registry)│        │ • GitHub Releases OTA Binary Publisher │
   └────────────────────────────────────────┘        └────────────────────────────────────────┘
                                             ▲
                                 WiFi / WSS  │ Bidirectional Sync
                                             ▼
 ═════════════════════════════  TIER 3: EMBEDDED HARDWARE & EDGE LAYER  ═══════════════════════════
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │ ESP32 Dual-Core (Lobby Controller & Master Edge Hub)                                     │
   │ • Real-Time Firebase Streaming via ESP-Client Library                                    │
   │ • Hardware Watchdog Timer (WDT) preventing CPU stall                                     │
   │ • I2C Bus Multiplexer (PCF8574 8-Bit Expander -> ULN2003APG Darlington Relay Drivers)    │
   ├──────────────────────────────────────────────────────────────────────────────────────────┤
   │ ESP32-C3 Super Mini / ESP8266 (Modular In-Wall Retrofit Nodes)                           │
   │ • Two-Way Hybrid Rocker Switch Sense Lines (Interrupt-driven physical toggling)         │
   │ • Sub-5ms Local Actuation Loop (Zero-latency offline performance)                        │
   ├──────────────────────────────────────────────────────────────────────────────────────────┤
   │ Arduino Nano (Hardware Analog & Sensor Bridge)                                           │
   │ • UART / I2C Serial Co-processor handling analog ADC conversion and sensor debouncing    │
   ├──────────────────────────────────────────────────────────────────────────────────────────┤
   │ Physical Sensor Suite:                                                                   │
   │ • DHT11/22 (Temp & Humidity)         • BMP180 (Barometric Pressure & Weather Prediction) │
   │ • MQ135 (Air Quality & Gas PPM)      • HC-SR04 (Ultrasonic Water Level Sensing)          │
   │ • Rain Sensor (Precipitation)        • PIR Sensor (Infrared Motion Detection)           │
   │ • Reed Switch (Door Magnetic State)  • Voltage Divider (AC Grid vs Inverter/Battery)     │
   │ • DS3231 RTC Module (Clock sync)     • High-Torque Servo (Motorized Deadbolt Mechanism) │
   └──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Technical Innovations & Proprietary Features

### 3.1. Zero-Lag Local Autonomy & Smart Two-Way Switching
Conventional smart switches fail when the local Wi-Fi drops. IoTMesh implements an **interrupt-driven edge state machine** in C++ on the ESP32/ESP32-C3:
- Physical wall switches are wired to dedicated GPIO interrupt pins.
- When flipped, the microcontroller toggles the relay in **<5 milliseconds**, regardless of whether the Wi-Fi router is on, off, or disconnected.
- When connection to the Firebase RTDB is active, physical flips trigger an asynchronous delta push to `/home/room1/controls`, instantly updating the web/mobile dashboard with zero perception of lag.
- If a user toggles an appliance via the smartphone app, the next physical flip of the wall switch toggles the appliance off or on correctly without requiring switch repositioning (True Digital 2-Way Switching).

### 3.2. 11-Parameter Sensor Telemetry & Weather Predictive Analytics
Rather than basic on/off toggles, IoTMesh ingests a multi-dimensional environmental stream every 2 seconds:
- **Dual-Sensor Thermal Calibration:** Samples ambient temperature from both DHT11 (1-Wire digital) and BMP180 (I2C Bosch sensor) and computes arithmetic mean convergence to eliminate sensor self-heating drift.
- **Barometric Weather Trend Engine:** Calculates running pressure variance ($\Delta hPa / \Delta t$) across rolling 12-sample windows to predict local meteorological shifts (`"Rising (Clear)"`, `"Falling (Rain)"`, `"Stable"`).
- **Combustible Gas Sentinel (MQ135):** Converts analog ADC readings into calibrated PPM. When PPM exceeds the critical safety threshold (>350 PPM), the system automatically triggers local alarms, cuts power to ignition-capable relays, and alerts remote users via Telegram within 1 second.
- **Ultrasonic Water Depth Telemetry (HC-SR04):** Measures distance to the water surface, calculates container fill percentage, and prevents pump dry-runs and water overflows.
- **Power Grid Surveillance:** Automatically distinguishes between Grid Mains ($1 = \text{Grid } ⚡$) and Inverter/Battery ($0 = \text{Inverter } 🔋$), reporting terminal battery voltage and remaining percentage to prompt energy-saving load shedding.

### 3.3. Multi-Stage High-Voltage Safety Ignition Interlock
In laboratory, workshop, and heavy-equipment environments, unauthorized or accidental triggering of high-voltage actuators can cause fires or bodily harm. IoTMesh implements a multi-stage defense-in-depth safety pipeline:
1. **Role-Based Clearance:** Guest accounts cannot view or access the ignition console.
2. **Cryptographic Passcode Arming:** Admin must enter a dedicated system arm key (`VITE_ARM_PASSWORD` or RTDB override) to transition the state machine to `ARMED`.
3. **5-Second Continuous Physical Hold Interlock:** The operator must physically press and hold the ignition interface continuously for 5.0 seconds. Every elapsed second generates audio and haptic feedback. Releasing the button at 4.9 seconds instantly aborts the charge and resets the capacitor state.
4. **Automated Cutoff & Audit Reset:** Upon completion of the 5-second hold, the high-voltage actuator is energized (`special/ignition = 1`), an acoustic warning rumble plays, a 3-second visual countdown starts, and the actuator is automatically de-energized back to `0`, logging the execution to the emergency audit log.

### 3.4. Over-The-Air (OTA) Cloud Firmware Pipeline & Rollback
IoTMesh eliminates manual USB flashing for field-deployed units:
- Built-in administrative portal allows engineers to upload compiled `.bin` firmware builds (up to 16 MB) directly through the browser.
- The Node.js backend pushes the asset to an immutable **GitHub Releases** repository, retrieves the CDN binary URL, and writes metadata to `ota/current`.
- Edge microcontrollers poll this path or receive WebSocket triggers to execute an atomic **ESP-HTTP-OTA partition flash**.
- In the event of firmware instability, admins can trigger a one-click rollback from `ota/history` to flash the previously verified firmware.

### 3.5. Web Audio Synthetic Sound Engine & Web Vibration Haptics
IoTMesh completely eliminates external `.mp3` or `.wav` audio asset downloads, reducing client payload and eliminating network fetch failures:
- Utilizes the browser's native **Web Audio API** to procedurally synthesize 11 distinct waveforms (pure sine waves, square arming ramps, low-frequency dissonant sawtooth buzzers, and major 7th harmonic confirmation chimes).
- Couples audio feedback with programmatic tactile vibration patterns using the **Web Vibration API** for high-stress operations (ignition arming, door locking, emergency gas alarms).

### 3.6. Dynamic Key Rotation & Telegram 2FA OTP Recovery
System credentials do not require static `.env` recompilation. Admins can rotate guest, admin, arm, and door passcodes directly through the cloud dashboard into `security/passwords`. In case of forgotten credentials, an automated Telegram 2FA pipeline dispatches a 6-digit cryptographic OTP expiring in 5 minutes directly to the verified administrator's encrypted Telegram chat.

---

## 4. Hardware Component Breakdown & Bill of Materials (BOM)

IoTMesh is engineered with commercially accessible, high-yield embedded components, keeping manufacturing costs below **$35 per multi-channel room node**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               IOTMESH PRODUCTION HARDWARE STACK                                 │
├───────────────────────┬───────────────────────────────┬──────────────────────┬──────────────────┤
│ Component             │ Technical Role                │ Interface / Bus      │ Cost Efficiency  │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ ESP-WROOM-32          │ Master Dual-Core IoT Hub      │ WiFi 802.11 b/g/n    │ High Processing, │
│                       │ & Multi-Sensor Coordinator    │ & BLE 4.2            │ Sub-$3.50 unit   │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ ESP32-C3 Super Mini   │ Ultra-Compact In-Wall         │ WiFi & Hardware GPIO │ Miniaturized     │
│                       │ Retrofit Node Controller      │ Interrupt Lines      │ In-Box Form      │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ ESP8266 NodeMCU       │ Auxiliary Room Node           │ WiFi Client to RTDB  │ Ultra-Low Cost   │
│                       │ Appliance Controller          │                      │ Sub-$2.00 unit   │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ Arduino Nano          │ Co-Processor & ADC Bridge     │ UART / I2C Bus       │ Dedicated Analog │
│                       │ (Analog Sensor Offloading)    │                      │ Pre-Processing   │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ PCF8574 Expander +    │ 8-Bit I2C Bus Expander driving│ I2C Bus (0x20) to    │ Eliminates GPIO  │
│ ULN2003APG Array      │ 5V/12V Relay Coils            │ Darlington Array     │ Starvation       │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ Optocoupled Relays    │ 4 to 8 Channels AC Switching  │ Galvanic Optical     │ Surge-Protected  │
│ (10A - 16A rated)     │ (Lights, Fans, Heavy Loads)   │ Isolation            │ Industrial Grade │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ MQ135 Gas Sensor      │ Combustible Gas & Air Quality │ Analog ADC (GPIO 34) │ Multi-Gas PPM    │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ Bosch BMP180          │ Barometric Pressure & Weather │ I2C Bus (0x77)       │ High-Precision   │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ DHT11 / DHT22         │ Ambient Temperature & Humidity│ 1-Wire Digital       │ Fast Acquisition │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ HC-SR04 Ultrasonic    │ Water Tank Depth Telemetry    │ Trigger / Echo GPIO  │ Non-Contact      │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ Reed Switch & PIR     │ Door & Motion Intrusion Sense │ Digital Interrupt    │ Micro-Amp Draw   │
├───────────────────────┼───────────────────────────────┼──────────────────────┼──────────────────┤
│ Voltage Divider       │ DC Battery / Grid Monitor     │ Analog ADC (GPIO 36) │ Real-Time Power  │
└───────────────────────┴───────────────────────────────┴──────────────────────┴──────────────────┘
```

---

## 5. Technology Readiness Level (TRL) & Current Progress

IoTMesh has advanced beyond theoretical research and is currently operating at **Technology Readiness Level 6 (TRL 6: Technology demonstrated in relevant environment)**.

```
       TRL 1-2            TRL 3-4              TRL 5               TRL 6 [CURRENT]          TRL 7-8
  ┌──────────────┐   ┌──────────────┐    ┌──────────────┐    ┌────────────────────────┐   ┌──────────────┐
  │ Concept &    │──►│ Breadboard & │───►│ Integrated   │───►│ Field-Tested Prototype │──►│ Commercial   │
  │ Basic Math   │   │ Bench Testing│    │ Multi-Node Lab│   │ 24/7 Production Node   │   │ Mass PCB &   │
  │ Formulation  │   │ Validation   │    │ Bench System │    │ Live Cloud Deployment  │   │ Certifications│
  └──────────────┘   └──────────────┘    └──────────────┘    └────────────────────────┘   └──────────────┘
```

### Validated Milestones Achieved:
- **Active 24/7 Field Testing:** Multiple prototype nodes deployed in live residential settings controlling room lighting, 4-speed ceiling fans, appliances, and water storage.
- **Production Firmware Repository:** 1,700+ lines of robust, optimized Arduino C++ firmware across `IoTMesh.ino` and `room1.ino` with automatic Wi-Fi reconnection routines, brownout-proof RF power calibration, and I2C address conflict handling.
- **Fully Deployed Single Page Web Application:** Interactive React 18 + TypeScript PWA active on Google Firebase Hosting ([iotmesh-4123.web.app](https://iotmesh-4123.web.app)) featuring live Recharts timeseries, role-based access control, procedural audio synthesis, and automated rule builder.
- **Live Event Microservices:** Node.js backend actively routing threshold alerts to multi-subscriber Telegram accounts and serving the GitHub Releases OTA pipeline.

---

## 6. Social, Environmental & Economic Impact

### 6.1. Democratizing Smart Infrastructure (Economic Inclusivity)
Commercial automation platforms like Crestron, Control4, or high-end KNX solutions cost thousands of dollars per room, rendering them inaccessible to schools, public clinics, small businesses, and middle-class households. IoTMesh can be assembled and deployed using open microcontrollers at **under 10% of the cost of commercial equivalents**, providing high-end safety and automation to previously excluded communities.

### 6.2. Energy Conservation & Peak-Load Management
- **Automated Load Shedding:** Automatically curtails heavy electrical loads (heaters, cooling units) when the system detects battery/inverter operation, prolonging inverter life and preventing battery deep-discharge damage.
- **Precision Scheduling:** Built-in routine timers turn off unoccupied room loads and exterior lighting during sunrise, eliminating phantom electricity consumption.

### 6.3. Water Resource Stewardship
Over-pumping and tank overflow represent one of the single largest sources of domestic water loss in municipal cities. IoTMesh’s ultrasonic feedback loop enables precise cutoff levels, mitigating thousands of liters of clean water waste per building annually.

### 6.4. Life Safety & Disaster Mitigation
Residential fires caused by slow gas cylinder leaks or electrical short circuits cause thousands of casualties each year. The MQ135 autonomous cutoff combined with Telegram instant broadcast provides immediate early warning to occupants—even if they are hundreds of miles away.

---

## 7. Project Grant Objectives & Fund Allocation Plan

Grant funding will bridge the critical transition from **TRL 6 (functional prototypes and software)** to **TRL 8 (mass-manufactured, industrial-certified hardware modules and wide-scale pilot deployments)**.

### Target Objectives Over 12 Months:
1. **Custom PCB Design & SMD Fabrication:** Consolidate the modular ESP32, relays, optocouplers, and power supply into custom, flame-retardant, injection-molded in-wall hardware modules.
2. **LoRa & ESP-NOW Mesh Integration:** Implement multi-hop LoRa radio protocol for zero-infrastructure agricultural and rural setups spanning up to 5 kilometers without cellular or Wi-Fi coverage.
3. **Electrical Safety & EMI/EMC Certification:** Obtain compliance certifications (CE, RoHS, BIS) for high-voltage isolation, over-voltage transient protection, and thermal reliability.
4. **Institutional Pilot Deployments:** Deploy 50 production-grade nodes across agricultural greenhouses, university laboratories, and residential complexes to collect longitudinal performance data.

### Proposed Budget Breakdown (Target Grant: ₹15,00,000 / ~$18,000 USD):

```
┌─────────────────────────────────────────────────────────────────────────────┬──────────────┬─────────┐
│ Budget Category                                                             │ Allocation   │ Share % │
├─────────────────────────────────────────────────────────────────────────────┼──────────────┼─────────┤
│ 1. Hardware R&D, Custom PCB Prototyping & SMT Assembly                      │ ₹ 4,50,000   │  30.0%  │
│    (Custom 4-layer PCB design, pick-and-place runs, potting, enclosures)    │              │         │
├─────────────────────────────────────────────────────────────────────────────┼──────────────┼─────────┤
│ 2. Electrical Testing, Safety Certification & Compliance                    │ ₹ 3,00,000   │  20.0%  │
│    (Thermal chamber testing, high-voltage surge, BIS/CE safety evaluation)  │              │         │
├─────────────────────────────────────────────────────────────────────────────┼──────────────┼─────────┤
│ 3. Pilot Deployment Hardware & Field Sensor Arrays                          │ ₹ 3,75,000   │  25.0%  │
│    (Components for 50 comprehensive node units across pilot sites)          │              │         │
├─────────────────────────────────────────────────────────────────────────────┼──────────────┼─────────┤
│ 4. Cloud Infrastructure, Edge Testing Equipment & Instrumentation           │ ₹ 1,50,000   │  10.0%  │
│    (Digital storage oscilloscopes, RF spectrum analyzers, 2-year cloud hosting)│              │         │
├─────────────────────────────────────────────────────────────────────────────┼──────────────┼─────────┤
│ 5. Technical Documentation, Open-Source Community & Field Support           │ ₹ 2,25,000   │  15.0%  │
│    (Technical documentation, developer kits, open schematics, onboarding)   │              │         │
├─────────────────────────────────────────────────────────────────────────────┼──────────────┼─────────┤
│ TOTAL REQUESTED GRANT FUNDING                                               │ ₹ 15,00,000  │ 100.0%  │
└─────────────────────────────────────────────────────────────────────────────┴──────────────┴─────────┘
```

---

## 8. Development Roadmap & Execution Milestones

```
Q1 2026: PCB Design & Miniaturization
├── Finalize Gerber schematics for IoTMesh Retrofit R4 & R8
├── Integrate high-voltage optocouplers with flame-retardant enclosures
└── Fabricate 50 prototype units via SMT assembly

Q2 2026: Protocol Expansion (ESP-NOW + LoRa Mesh)
├── Implement hybrid ESP-NOW mesh networking for intra-building node relaying
├── Develop LoRa bridge node for long-distance perimeter sensing (up to 5 km)
└── Complete thermal and electromagnetic stress testing

Q3 2026: Multi-Site Pilot Deployments
├── Deploy 25 residential units and 25 agricultural/laboratory units
├── Conduct continuous telemetry benchmarks and measure mean time between failures (MTBF)
└── Validate Telegram 2FA and OTA remote update reliability in live conditions

Q4 2026: Open Documentation, Certification & Commercial Packaging
├── Publish comprehensive developer SDK and hardware schematics under MIT/CERN-OHL
├── Submit hardware for formal domestic safety certifications (BIS)
└── Prepare plug-and-play retrofit kits for commercial and grant-assisted public distribution
```

---

## 9. Conclusion

**IoTMesh** represents a fundamental reimagining of edge automation and environmental telemetry. It addresses the vulnerabilities of modern IoT systems—transforming smart devices from fragile, cloud-dependent luxuries into robust, autonomous, life-safety-grade infrastructure. 

With proven working firmware, an enterprise-grade cloud telemetry interface, sub-second response times, and a functional safety interlock architecture already demonstrated in the field, IoTMesh is exceptionally positioned for rapid real-world scaling. Grant funding will directly accelerate miniaturized hardware production, safety certification, and pilot deployments—delivering affordable, reliable, and sustainable smart infrastructure to the communities that need it most.

---

### Lead Researcher & Contact Details
- **Lead Developer & System Architect:** Anubhav Bajpai  
- **Email:** [anubhavb4123@gmail.com](mailto:anubhavb4123@gmail.com)  
- **GitHub:** [https://github.com/anubhavb4123](https://github.com/anubhavb4123)  
- **Project Repository:** [https://github.com/anubhavb4123/IoTMesh](https://github.com/anubhavb4123/IoTMesh)  
- **Live System Application:** [https://iotmesh-4123.web.app](https://iotmesh-4123.web.app)  
