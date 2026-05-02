const { requestDurationMs } = require("../config/prometheus");

function requestMetricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const route = req.route?.path || req.path;

    requestDurationMs.observe(
      {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      },
      durationMs,
    );
  });
  next();
}

module.exports = { requestMetricsMiddleware };
