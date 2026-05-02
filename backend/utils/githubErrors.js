function githubHttpStatus(err) {
  if (err == null) return 500;
  if (typeof err.status === "number") return err.status;
  if (typeof err.response?.status === "number") return err.response.status;
  return 500;
}

module.exports = { githubHttpStatus };
