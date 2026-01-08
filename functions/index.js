const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.subscribeToTopic = functions.https.onRequest(async (req, res) => {
  const token = req.body.token;

  if (!token) {
    res.status(400).send("Missing token");
    return;
  }

  try {
    await admin.messaging().subscribeToTopic(token, "iotmesh-alerts");
    res.status(200).send("Subscribed successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Subscription failed");
  }
});

exports.alertNotifier = functions.database
  .ref("/home/room1/sensor")
  .onUpdate(async (change) => {
    const before = change.before.val();
    const data = change.after.val();

    let body = null;

    // 🔥 Trigger only on REAL changes (anti-spam)
    if (data.gas > 300 && before.gas <= 300) {
      body = `High Gas Level: ${data.gas} PPM`;
    } 
    else if (data.WaterLevel < 20 && before.WaterLevel >= 20) {
      body = "Water tank is LOW 🚰";
    } 
    else if (data.rain === true && before.rain === false) {
      body = "Rain detected 🌧️";
    } 
    else if (data.batteryPercent < 20 && before.batteryPercent >= 20) {
      body = "Battery critically low 🔋";
    }

    if (!body) return null;

    const payload = {
      notification: {
        title: "IOTMesh Alert 🚨",
        body,
      },
      data: {
        type: "sensor-alert",
      },
    };

    await admin.messaging().sendToTopic("iotmesh-alerts", payload);

    console.log("✅ Notification sent:", body);
    return null;
  });