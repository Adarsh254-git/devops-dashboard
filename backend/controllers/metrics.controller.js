const { register } = require("../config/prometheus");

async function metrics(_req, res) {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
}

module.exports = { metrics };
