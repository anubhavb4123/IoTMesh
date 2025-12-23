// src/main.tsx — add at the very top
console.log("APP ENTRY: src/main.tsx loaded");
console.log("VITE env DB URL:", import.meta.env.VITE_FIREBASE_DATABASE_URL);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
// Register Service Worker for Firebase Messaging
navigator.serviceWorker
  .register("/firebase-messaging-sw.js")
  .then(() => console.log("Service Worker Registered"));
