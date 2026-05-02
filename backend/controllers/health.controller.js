const { getConnectionState } = require("../config/database");

function health(_req, res) {
  res.json({
    status: "ok",
    mongo: getConnectionState(),
  });
}

module.exports = { health };
