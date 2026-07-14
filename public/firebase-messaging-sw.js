importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBQPWITzpEohdAwCCBoQFO1UkxwR4ITwfY",
    authDomain: "followups-a8035.firebaseapp.com",
    projectId: "followups-a8035",
    storageBucket: "followups-a8035.firebasestorage.app",
    messagingSenderId: "693695655885",
    appId: "1:693695655885:web:f2a8c4ee5cce005e099e84",
});

const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//     console.log("[firebase-messaging-sw.js] Background", payload);

//     self.registration.showNotification(
//         payload.notification.title,
//         {
//             body: payload.notification.body,
//             icon: "/favicon.ico"
//         }
//     );
// });
messaging.onBackgroundMessage((payload) => {
    console.log("Background:", payload);

    self.registration.showNotification(
        payload.notification.title,
        {
            body: payload.notification.body,
            icon: payload.notification.icon,
            data: payload.data
        }
    );
});