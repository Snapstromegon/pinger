export class Metric {
  constructor(initValue) {
    this.value = initValue;
  }
}

export default class MetricsManager {
  metrics = new Map();

  addMetric(name, tags, metric) {
    const tagsMap = new Map();
    Object.entries(tags).forEach(([name, value]) => {
      tagsMap.set(name, value);
    });
    this.metrics.set({ name, tags: tagsMap }, metric);
  }

  serializeMetrics() {
    return [...this.metrics.entries()]
      .filter(([meta, metric]) => metric.value !== undefined)
      .map(
        ([{ name, tags }, metric]) =>
          `${name}{${this.serializeTags(tags)}} ${metric.value}`
      )
      .join("\n");
  }

  serializeTags(tagsMap) {
    return [...tagsMap.entries()]
      .map(([key, value]) => `${key}="${value}"`)
      .join(",");
  }

  serializeForJSON() {
    const res = {};
    for (const [meta, metric] of this.metrics.entries()) {
      if (!res[meta.tags.get("host")]) {
        res[meta.tags.get("host")] = {
          tags: Object.fromEntries(meta.tags.entries()),
          metrics: {},
        };
      }
      if (meta.name == "ping_alive") {
        res[meta.tags.get("host")].metrics[meta.name] = metric.value == 1;
      } else {
        res[meta.tags.get("host")].metrics[meta.name] = metric.value;
      }
    }
    return Object.values(res);
  }
}
