const promClient = require("prom-client");

const register = new promClient.Registry();
register.setDefaultLabels({ app: "devops-dashboard" });

promClient.collectDefaultMetrics({ register });

const requestDurationMs = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

module.exports = { register, promClient, requestDurationMs };
