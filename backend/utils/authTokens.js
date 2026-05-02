const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function getExpiresIn() {
  return process.env.JWT_EXPIRES_IN?.trim() || "7d";
}

function signAccessToken(userId, email) {
  return jwt.sign({ sub: userId, email }, getJwtSecret(), {
    expiresIn: getExpiresIn(),
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  getExpiresIn,
};
