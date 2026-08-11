// const jwt = require("jsonwebtoken");
// const User = require("../../models/user.model");

// const superAdminAuth = async (req, res, next) => {
//     try {

//         let token = req.cookies?.superadmin_token;

//         if (!token && req.headers.authorization?.startsWith("Bearer ")) {
//             token = req.headers.authorization.split(" ")[1];
//         }

//         if (!token) {
//             if (req.originalUrl.startsWith("/superadmin/api")) {
//                 return res.status(401).json({
//                     success: false,
//                     message: "No token provided"
//                 });
//             }

//             return res.redirect("/superadmin/super_login");
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         const user = await User.findById(decoded.userId)
//             .populate("role");

//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         // ✅ ObjectId populate hone ke baad roleName check karo
//         if (!user.role || user.role.roleName !== "super_admin") {

//             if (req.originalUrl.startsWith("/superadmin/api")) {
//                 return res.status(401).json({
//                     success: false,
//                     message: "Not authorized"
//                 });
//             }

//             return res.redirect("/superadmin/super_login");
//         }

//         req.user = user;

//         next();

//     } catch (err) {

//         console.log(err);

//         if (req.originalUrl.startsWith("/superadmin/api")) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid token"
//             });
//         }

//         return res.redirect("/superadmin/super_login");
//     }
// };

// module.exports = { superAdminAuth };

const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");

const superAdminAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.superadmin_token || req.cookies?.token;
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            if (req.originalUrl.startsWith("/superadmin/api") || req.originalUrl.startsWith("/api/roles")) {
                return res.status(401).json({ success: false, message: "No token provided" });
            }
            return res.redirect("/superadmin/super_login");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate("role");
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const roleName = user.role?.roleName;
        // ⭐ super_admin AUR admin dono allowed
        if (!roleName || !['super_admin', 'admin'].includes(roleName)) {
            if (req.originalUrl.startsWith("/superadmin/api") || req.originalUrl.startsWith("/api/roles")) {
                return res.status(401).json({ success: false, message: "Not authorized" });
            }
            return res.redirect("/superadmin/super_login");
        }

        req.user = user;
        req.isSuperAdmin = roleName === 'super_admin'; // ⭐ isse aage scoping karenge
        next();
    } catch (err) {
        console.log(err);
        if (req.originalUrl.startsWith("/superadmin/api") || req.originalUrl.startsWith("/api/roles")) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        return res.redirect("/superadmin/super_login");
    }
};

module.exports = { superAdminAuth };