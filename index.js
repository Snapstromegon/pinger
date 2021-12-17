import ping from "ping";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fastify from "fastify";

import MetricsManager, { Metric } from "./prometheus_metrics.js";

const metricMgr = new MetricsManager();

const args = yargs(hideBin(process.argv))
  .option("ping-interval", {
    alias: "t",
    default: 10,
    type: "number",
    description: "Ping interval in seconds",
  })
  .option("hosts", {
    alias: "h",
    type: "array",
    description: "Hosts to ping",
  })
  .option("port", {
    alias: "p",
    default: 9500,
    type: "number",
    description: "Port to expose metrics on",
  })
  .option("listen", {
    alias: "i",
    default: "0.0.0.0",
    type: "string",
    description: "Interface to expose metrics on",
  })
  .option("enable-logging", {
    alias: "l",
    type: "boolean",
    description: "If logging should be enabled",
  })
  .demandOption(["hosts"])
  .parse();

const app = fastify({ logger: args["enable-logging"] });

const hostMetrics = new Map();

for (const host of args.hosts) {
  const metrics = {
    pingTime: new Metric(0),
    pingAlive: new Metric(0),
    lastPing: new Metric(0),
    lastPong: new Metric(0),
    pingsAlive: new Metric(0),
    pingsTotal: new Metric(0),
  };
  hostMetrics.set(host, metrics);
  metricMgr.addMetric("ping_time_duration", { host }, metrics.pingTime);
  metricMgr.addMetric("ping_alive", { host }, metrics.pingAlive);
  metricMgr.addMetric("ping_last_ping_seconds", { host }, metrics.lastPing);
  metricMgr.addMetric("ping_last_pong_seconds", { host }, metrics.lastPong);
  metricMgr.addMetric("ping_pings_alive", { host }, metrics.pingsAlive);
  metricMgr.addMetric("ping_pings_total", { host }, metrics.pingsTotal);
}

async function pingAllHosts() {
  args.hosts.map(async (host) => {
    const metrics = hostMetrics.get(host);
    metrics.lastPing.value = Date.now() / 1000;
    const probe = await ping.promise.probe(host);
    if (probe.alive) {
      metrics.lastPong.value = Date.now() / 1000;
      metrics.pingsAlive++;
    }
    metrics.pingsTotal++;
    metrics.pingTime.value = probe.time / 1000;
    metrics.pingAlive.value = probe.alive ? 1 : 0;
  });
}

setInterval(pingAllHosts, args["ping-interval"] * 1000);
pingAllHosts();

app.get("/metrics", () => {
  return metricMgr.serializeMetrics();
});

app.get("/metrics/json", () => {
  return metricMgr.serializeForJSON();
});

app.get("/", (_, reply) => {
  reply.redirect("/metrics");
});

app.listen(args.port, args.listen, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(address);
});
