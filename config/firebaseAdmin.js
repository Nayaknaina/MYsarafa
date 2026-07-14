// const admin = require("firebase-admin");
// console.log("ADMIN OBJECT =>", admin);
// const serviceAccount = require("../firebase/serviceAccountKey.json");

const admin = require("firebase-admin");
const { initializeApp, cert, getApps } = require("firebase-admin/app");

const serviceAccount = require("../firebase/serviceAccountKey.json");

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

module.exports = admin;