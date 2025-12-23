# Make Home Command Center Live Data Implementation

## Plan
1. Update Sensors.tsx to use useSensorData hook for live temperature, humidity, AQI, pressure data.
2. Update Devices.tsx to use useDeviceControls hook for live main light and ceiling fan controls.
3. Update Dashboard.tsx to use live sensor data and add real-time system status.
4. Keep the historical graph in Sensors but generate it from live data trends.

## Dependent Files
- home-command-center-main/src/pages/Sensors.tsx
- home-command-center-main/src/pages/Devices.tsx
- home-command-center-main/src/pages/Dashboard.tsx

## Followup steps
- Set up Firebase environment variables (VITE_FIREBASE_*)
- Test with Firebase Realtime Database running
- Handle loading/error states

## Progress
- [ ] Update Sensors.tsx
- [ ] Update Devices.tsx
- [ ] Update Dashboard.tsx
- [ ] Test implementation
