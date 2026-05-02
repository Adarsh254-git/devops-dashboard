const { verifyAccessToken } = require("../utils/authTokens");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const raw = header.slice(7).trim();
  if (!raw) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = verifyAccessToken(raw);
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
