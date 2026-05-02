const os = require("os");
const osUtils = require("os-utils");

function getStats(_req, res) {
  osUtils.cpuUsage((value) => {
    const cpuUsage = (value * 100).toFixed(2);

    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = (((totalMem - freeMem) / totalMem) * 100).toFixed(2);

    res.json({
      cpuUsage: parseFloat(cpuUsage),
      memoryUsage: parseFloat(memUsage),
      uptime: os.uptime(),
      timestamp: new Date().toLocaleTimeString(),
    });
  });
}

module.exports = { getStats };
