const { getMessaging } = require("firebase-admin/messaging");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

async function sendNotificationToUsers(userIds, title, body, data = {}, link = "/announcements") {

    console.log("===== NOTIFY FUNCTION CALLED =====");
    console.log("Users:", userIds);
    console.log("Title:", title);
    console.log("Body:", body);

    if (!userIds || !userIds.length) return { successCount: 0, failureCount: 0 };

    const users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $exists: true, $ne: null }
    }).select("_id fcmToken");

    console.log("Users found:", users.length);
    console.log(users);

    const tokenMap = users.map(u => ({ userId: u._id.toString(), token: u.fcmToken }));
    if (!tokenMap.length) return { successCount: 0, failureCount: 0 };
    console.log(tokenMap);

    const messaging = getMessaging();
    const CHUNK_SIZE = 500;
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (let i = 0; i < tokenMap.length; i += CHUNK_SIZE) {
        const chunk = tokenMap.slice(i, i + CHUNK_SIZE);
        const tokens = chunk.map(c => c.token);

        const stringData = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
        );

        try {
            const message = {
                tokens,
                notification: { title, body },
                data: stringData,
                webpush: {
                    notification: {
                        title,
                        body,
                        icon: "/assets/favicon/favicon_logo.png"
                    },
                    fcmOptions: {
                        link
                    }
                }
            };

            console.log("FCM MESSAGE =>", JSON.stringify(message, null, 2));

            const response = await messaging.sendEachForMulticast(message);

            successCount += response.successCount;
            failureCount += response.failureCount;

            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const code = res.error && res.error.code;
                    if (
                        code === "messaging/registration-token-not-registered" ||
                        code === "messaging/invalid-registration-token"
                    ) {
                        invalidTokens.push(chunk[idx].token);
                    }
                    console.error("FCM send error:", code, res.error?.message);
                }
            });

            console.log("Success:", response.successCount);
            console.log("Failed:", response.failureCount);
            console.log("Responses:", response.responses);
        } catch (err) {
            console.error("FCM batch send failed:", err.message);
            console.error("FCM Error:", err);
        }
    }

    if (invalidTokens.length) {
        await User.updateMany(
            { fcmToken: { $in: invalidTokens } },
            { $unset: { fcmToken: "" } }
        );
        console.log(`Cleaned up ${invalidTokens.length} invalid FCM tokens`);
    }

    return { successCount, failureCount };
}

async function saveNotificationsToDb(userIds, title, body, type, data = {}, link = "/announcements") {
  if (!userIds || !userIds.length) return;
  try {
    const docs = userIds.map(uid => ({ recipient: uid, type, title, body, link, data }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error("Error saving notifications to DB:", err.message);
  }
}

// ⭐ NEW — isko hi controllers se call karenge
async function notifyUsers(userIds, title, body, type, data = {}, link = "/announcements") {
  await saveNotificationsToDb(userIds, title, body, type, data, link);
  return sendNotificationToUsers(userIds, title, body, data, link);
}

module.exports = { sendNotificationToUsers, saveNotificationsToDb, notifyUsers };