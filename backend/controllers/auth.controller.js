const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { getConnectionState } = require("../config/database");
const { signAccessToken } = require("../utils/authTokens");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;

function dbReady(res) {
  if (process.env.SKIP_DB === "true" || getConnectionState() !== "connected") {
    res.status(503).json({ error: "Database is not available" });
    return false;
  }
  return true;
}

function jwtSecretOk() {
  const secret = process.env.JWT_SECRET?.trim();
  return Boolean(secret);
}

async function register(req, res) {
  if (!dbReady(res)) return;
  if (!jwtSecretOk()) {
    res.status(500).json({ error: "Server misconfiguration: JWT_SECRET is required" });
    return;
  }

  const { email: rawEmail, password, displayName = "" } = req.body || {};
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const name =
    typeof displayName === "string" ? displayName.trim().slice(0, 120) : "";

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      email,
      passwordHash,
      displayName: name,
    });

    const token = signAccessToken(user._id.toString(), user.email);
    return res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("[auth] register:", err.message);
    return res.status(500).json({ error: "Registration failed" });
  }
}

async function login(req, res) {
  if (!dbReady(res)) return;
  if (!jwtSecretOk()) {
    res.status(500).json({ error: "Server misconfiguration: JWT_SECRET is required" });
    return;
  }

  const { email: rawEmail, password } = req.body || {};
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signAccessToken(user._id.toString(), user.email);
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[auth] login:", err.message);
    return res.status(500).json({ error: "Login failed" });
  }
}

async function me(req, res) {
  if (!dbReady(res)) return;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[auth] me:", err.message);
    return res.status(500).json({ error: "Failed to load profile" });
  }
}

async function updateMe(req, res) {
  if (!dbReady(res)) return;

  const { displayName, currentPassword, newPassword } = req.body || {};
  const wantsName = displayName !== undefined;
  const wantsPw = newPassword !== undefined;

  if (!wantsName && !wantsPw) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    let user;
    if (wantsPw) {
      user = await User.findById(req.user.id).select("+passwordHash");
    } else {
      user = await User.findById(req.user.id);
    }

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    if (wantsName) {
      const name =
        typeof displayName === "string" ? displayName.trim().slice(0, 120) : "";
      user.displayName = name;
    }

    if (wantsPw) {
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }
      if (typeof currentPassword !== "string" || !currentPassword) {
        return res.status(400).json({ error: "Current password is required to set a new password" });
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    }

    await user.save();

    const fresh = await User.findById(user._id);
    return res.json({
      user: {
        id: fresh._id.toString(),
        email: fresh.email,
        displayName: fresh.displayName,
        role: fresh.role,
      },
    });
  } catch (err) {
    console.error("[auth] updateMe:", err.message);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

module.exports = {
  register,
  login,
  me,
  updateMe,
};
