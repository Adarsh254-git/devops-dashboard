function formatRelativeTime(dateString) {
  const diff = Date.now() - new Date(dateString);
  const mins = Math.floor(diff / 60000);
  return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
}

function mapWorkflowRunToDeployment(run) {
  return {
    id: run.id,
    commitMsg: run.head_commit?.message || "Manual Run",
    status:
      run.conclusion === "success"
        ? "success"
        : run.status === "completed"
          ? "failure"
          : "pending",
    time: formatRelativeTime(run.created_at),
    env: run.head_branch,
    version: `build-${run.run_number}`,
  };
}

function mapWorkflowRunToListItem(run) {
  return {
    id: run.id,
    runNumber: run.run_number,
    commitMsg: run.head_commit?.message?.split("\n")[0] || "—",
    branch: run.head_branch,
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    htmlUrl: run.html_url,
  };
}

module.exports = {
  formatRelativeTime,
  mapWorkflowRunToDeployment,
  mapWorkflowRunToListItem,
};
