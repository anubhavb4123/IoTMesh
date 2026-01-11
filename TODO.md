# Convert Web App to READ-ONLY Alert Dashboard

## Tasks
- [x] Remove all alert generation logic from `useSensorData.ts`
- [x] Remove test buttons from `Alerts.tsx` to make it pure viewer
- [x] Clean up unused imports
- [x] Verify TypeScript compilation
- [x] Test that alerts only appear from ESP firmware

## ✅ Conversion Complete!
The web app has been successfully converted to a READ-ONLY alert dashboard.
- Frontend no longer generates or triggers alerts
- Alerts page displays Firebase data in reverse chronological order
- No write operations to alert paths from frontend
- TypeScript compiles with zero errors
- ESP firmware is now the single source of truth for alerts
