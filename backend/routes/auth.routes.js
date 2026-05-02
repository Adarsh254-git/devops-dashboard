const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/api/auth/register", authController.register);
router.post("/api/auth/login", authController.login);
router.get("/api/auth/me", requireAuth, authController.me);
router.patch("/api/auth/me", requireAuth, authController.updateMe);

module.exports = router;
