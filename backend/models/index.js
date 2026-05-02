/**
 * Mongoose document models. Import side effects register models with mongoose.
 * Mapper helpers (e.g. deployment.model.js GitHub DTOs) stay separate.
 */
require("./User");
require("./Alert");

module.exports = {
  User: require("./User"),
  Alert: require("./Alert"),
};
