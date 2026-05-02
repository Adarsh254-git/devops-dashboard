const express = require("express");
const cors = require("cors");
const { requestMetricsMiddleware } = require("./middleware/requestMetrics");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(requestMetricsMiddleware);
app.use(routes);

module.exports = app;
