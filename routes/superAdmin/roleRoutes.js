const express = require("express");
const router = express.Router();

const roleController = require("../../controllers/superAdmin/roleController");

// Middleware
const { authMiddleware } = require("../../middleware/auth");
// Agar admin middleware hai to use bhi add kar dena
// const { isSuperAdmin } = require("../middleware/adminMiddleware");


// ==============================
// Role Routes
// ==============================

// Create Role
router.post("/", authMiddleware, roleController.createRole);

// Get All Roles
router.get("/", authMiddleware, roleController.getRoles);

// Stats (specific route — before /:id)
router.get("/stats", authMiddleware, roleController.getRoleStats);

// Users (specific route — before /:id)
router.get("/users", authMiddleware, roleController.getUsers);

// Assign Role to User (specific route — MUST be before /:id)
router.put("/assign", authMiddleware, roleController.assignRole);

// Available permissions list (specific route — MUST be before /:id)
router.get("/permissions", authMiddleware, roleController.getAvailablePermissions);

// Toggle a single permission on a role (specific route — MUST be before /:id)
router.put("/:id/toggle-permission", authMiddleware, roleController.togglePermission);

// Get Single Role (wildcard — after specific routes)
router.get("/:id", authMiddleware, roleController.getRole);

// Update Role (wildcard — after specific routes)
router.put("/:id", authMiddleware, roleController.updateRole);

// Delete Role
router.delete("/:id", authMiddleware, roleController.deleteRole);

module.exports = router;