const autocannon = require("autocannon");
const http = require("http");
const app = require("../app");

const PORT = Number(process.env.PERF_PORT || 3100);
const CONNECTIONS = Number(process.env.PERF_CONNECTIONS || 20);
const DURATION = Number(process.env.PERF_DURATION || 10);
const MIN_RPS = Number(process.env.PERF_MIN_RPS || 50);
const MAX_P95_MS = Number(process.env.PERF_MAX_P95_MS || 250);
const MAX_NON_2XX = Number(process.env.PERF_MAX_NON_2XX || 0);

function runPerf(url) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections: CONNECTIONS,
      duration: DURATION,
      method: "GET",
      headers: { Accept: "application/json" },
    });

    autocannon.track(instance, { renderProgressBar: false, renderLatencyTable: false });
    instance.on("done", resolve);
    instance.on("error", reject);
  });
}

async function main() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));

  try {
    const result = await runPerf(`http://127.0.0.1:${PORT}/health`);
    const p95 = Number(result.latency.p95 || result.latency.p97_5 || result.latency.p99 || result.latency.average);
    const rps = result.requests.average;
    const non2xx = result["non2xx"];

    console.log(`Perf summary: rps=${rps.toFixed(2)} p95=${p95}ms non2xx=${non2xx}`);

    const failed = rps < MIN_RPS || p95 > MAX_P95_MS || non2xx > MAX_NON_2XX;
    if (failed) {
      console.error(
        `Performance gate failed (minRps=${MIN_RPS}, maxP95Ms=${MAX_P95_MS}, maxNon2xx=${MAX_NON_2XX})`
      );
      process.exitCode = 1;
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
