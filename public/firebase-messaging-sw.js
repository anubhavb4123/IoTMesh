/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCOncUZJrlqdXbRBcHRVwMLfy2nNU6-AGI",
  authDomain: "iotmesh-4123.firebaseapp.com",
  projectId: "iotmesh-4123",
  messagingSenderId: "896202432620",
  appId: "1:896202432620:web:dfb6c28be9e99865b27f49",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const title = payload.notification?.title || "IoTMesh Alert";
  const options = {
    body: payload.notification?.body || "New update received",
    icon: "/icon-192.png",
  };

  self.registration.showNotification(title, options);
});