const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const maxIterations = 10;

const runTests = () => {
  return spawnSync("npm", ["test"], {
    cwd: projectRoot,
    encoding: "utf-8"
  });
};

const readCoverageMetrics = () => {
  const coveragePath = path.join(projectRoot, "coverage", "coverage-final.json");

  if (!fs.existsSync(coveragePath)) {
    return null;
  }

  const data = JSON.parse(fs.readFileSync(coveragePath, "utf-8"));
  const totals = {
    statements: 0,
    coveredStatements: 0,
    branches: 0,
    coveredBranches: 0,
    functions: 0,
    coveredFunctions: 0,
    lines: 0,
    coveredLines: 0
  };

  Object.values(data).forEach((fileMetrics) => {
    const statementIds = Object.keys(fileMetrics.statementMap || {});
    const branchHits = Object.values(fileMetrics.b || {});
    const functionIds = Object.keys(fileMetrics.fnMap || {});

    totals.statements += statementIds.length;
    totals.coveredStatements += statementIds.filter((id) => (fileMetrics.s || {})[id] > 0).length;

    totals.branches += branchHits.reduce((acc, counts) => acc + counts.length, 0);
    totals.coveredBranches += branchHits.reduce(
      (acc, counts) => acc + counts.filter((count) => count > 0).length,
      0
    );

    totals.functions += functionIds.length;
    totals.coveredFunctions += functionIds.filter((id) => (fileMetrics.f || {})[id] > 0).length;

    totals.lines += statementIds.length;
    totals.coveredLines += statementIds.filter((id) => (fileMetrics.s || {})[id] > 0).length;
  });

  return {
    statements: (totals.coveredStatements / (totals.statements || 1)) * 100,
    branches: (totals.coveredBranches / (totals.branches || 1)) * 100,
    functions: (totals.coveredFunctions / (totals.functions || 1)) * 100,
    lines: (totals.coveredLines / (totals.lines || 1)) * 100
  };
};

const formatMetrics = (metrics) =>
  Object.entries(metrics)
    .map(([key, value]) => `${key}: ${value.toFixed(2)}%`)
    .join(", ");

const summarizeFailures = (output) => {
  const failureLines = output
    .split("\n")
    .filter((line) => line.trim().startsWith("●") || line.includes("FAIL"));

  return failureLines.join("\n");
};

for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
  console.log(`\nSelf-heal iteration ${iteration}/${maxIterations}`);
  const result = runTests();
  if (result.stdout) {
    console.log(result.stdout.trim());
  }
  if (result.stderr) {
    console.error(result.stderr.trim());
  }

  if (result.status === 0) {
    const metrics = readCoverageMetrics();

    if (metrics && metrics.statements >= 100 && metrics.branches >= 100 && metrics.functions >= 100 && metrics.lines >= 100) {
      console.log("All tests passed with 100% coverage. ✅");
      process.exit(0);
    }

    console.error("Coverage below required threshold:");
    console.error(formatMetrics(metrics || {}));
    break;
  }

  console.error("Tests failed. Summary:");
  console.error(summarizeFailures(result.stdout || ""));
  break;
}

console.error("Unable to automatically fix failing tests or coverage gaps. Please review the output above.");
process.exit(1);
