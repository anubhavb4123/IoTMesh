importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCOncUZJrlqdXbRBcHRVwMLfy2nNU6-AGI",
  authDomain: "iotmesh-4123.firebaseapp.com",
  projectId: "iotmesh-4123",
  messagingSenderId: "896202432620",
  appId: "1:896202432620:web:dfb6c28be9e99865b27f49",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/favicon.ico",
    }
  );
});