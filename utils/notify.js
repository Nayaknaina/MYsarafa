const { getMessaging } = require("firebase-admin/messaging");
const User = require("../models/user.model");

async function sendNotificationToUsers(userIds, title, body, data = {}) {

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
                notification: {
                    title,
                    body,
                },
                data: stringData,
                webpush: {
                    notification: {
                        title,
                        body,
                        icon: "/assets/favicon/favicon_logo.png"
                    },
                    fcmOptions: {
                        link: "/announcements"
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

module.exports = { sendNotificationToUsers };