console.log("🔥 firebase.js loaded");
// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
// Firebase Messaging
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQPWITzpEohdAwCCBoQFO1UkxwR4ITwfY",
    authDomain: "followups-a8035.firebaseapp.com",
    projectId: "followups-a8035",
    storageBucket: "followups-a8035.firebasestorage.app",
    messagingSenderId: "693695655885",
    appId: "1:693695655885:web:f2a8c4ee5cce005e099e84",
    measurementId: "G-XYDTYM9LCX"
};
// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Initialize Messaging
const messaging = getMessaging(app);

// 5. Register Service Worker
const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
console.log("✅ Firebase Initialized", app);
console.log("✅ Firebase Messaging Initialized", messaging);

console.log("✅ Service Worker Registered", registration);

console.log("🔥 requestNotificationPermission called");
async function requestNotificationPermission() {
    console.log("🔥 requestNotificationPermission finished");
    try {
        const permission = await Notification.requestPermission();
        console.log("Notification Permission:", permission);
        if (permission === "granted") {
            console.log("Notification:", Notification.permission);
            console.log("Registration:", registration);
            console.log("Messaging:", messaging);
            const token = await getToken(messaging, {
                vapidKey: "BCSMDC-Zc-Kqc-aPSOGNM30XE2Lc3TvWKrgGx-ctdhibeiQYmoOoUWc_TBtDeWmHMcfqtC3yaIBX0_fXMMWRbNQ",
                serviceWorkerRegistration: registration
            });
            console.log("========== FCM TOKEN ==========");
            console.log(token);
            console.log("===============================");
            const response = await fetch("/user-app/save-fcm-token", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fcmToken: token
                })
            });
            const result = await response.json();
            console.log("✅ Save FCM Response:", result);
        } else {
            console.log("Notification Permission Denied");
        }
    } catch (error) {
        console.error("FULL ERROR", error);
        console.error(error.name);
        console.error(error.message);
    }
}
requestNotificationPermission();

console.log("🔥 Registering onMessage listener");

onMessage(messaging, (payload) => {
    console.log("🔥 Foreground message:", payload);
    console.log("Foreground message:", payload);
    console.log("Notification object:", payload.notification);

    if (Notification.permission === "granted") {
        try {
            const notification = new Notification(
                payload.notification.title,
                {
                    body: payload.notification.body,
                    icon: payload.notification.icon,
                    requireInteraction: true
                }
            );

            console.log(notification);

            notification.onclick = () => {
                window.focus();
                window.location.href = "/announcements";
            };

            console.log("Notification created:", notification);
        } catch (err) {
            console.error("Notification Error:", err);
        }
    }
});