// Service Worker for IoTMesh PWA & Firebase Messaging
const CACHE_NAME = 'iotmesh-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through to network for real-time telemetry
  return;
});
