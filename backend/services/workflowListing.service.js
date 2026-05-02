const { octokit } = require("../config/octokit");

/**
 * @param {number} perPage
 * @param {string} [workflowId]
 */
async function listWorkflowRuns(perPage, workflowId = "main.yml") {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  const response = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id: workflowId,
    per_page: perPage,
  });

  return response.data.workflow_runs || [];
}

module.exports = { listWorkflowRuns };
