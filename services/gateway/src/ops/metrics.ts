export type MetricsSnapshot = {
  startedAtMs: number;
  reqTotal: number;
  reqByRoute: Record<string, number>;
  reqByStatus: Record<string, number>;
  rateLimited: number;
};

export class Metrics {
  readonly startedAtMs = Date.now();
  reqTotal = 0;
  reqByRoute: Record<string, number> = {};
  reqByStatus: Record<string, number> = {};
  rateLimited = 0;

  incRoute(route: string) {
    this.reqTotal += 1;
    this.reqByRoute[route] = (this.reqByRoute[route] ?? 0) + 1;
  }

  incStatus(status: number) {
    const k = String(status);
    this.reqByStatus[k] = (this.reqByStatus[k] ?? 0) + 1;
  }

  snapshot(): MetricsSnapshot {
    return {
      startedAtMs: this.startedAtMs,
      reqTotal: this.reqTotal,
      reqByRoute: { ...this.reqByRoute },
      reqByStatus: { ...this.reqByStatus },
      rateLimited: this.rateLimited
    };
  }

  renderPrometheus(service = "kindrail-gateway"): string {
    const lines: string[] = [];
    const up = 1;
    lines.push(`# HELP kr_up Service is up`);
    lines.push(`# TYPE kr_up gauge`);
    lines.push(`kr_up{service="${service}"} ${up}`);

    lines.push(`# HELP kr_requests_total Total requests`);
    lines.push(`# TYPE kr_requests_total counter`);
    lines.push(`kr_requests_total{service="${service}"} ${this.reqTotal}`);

    lines.push(`# HELP kr_requests_by_route_total Requests by route`);
    lines.push(`# TYPE kr_requests_by_route_total counter`);
    for (const [route, v] of Object.entries(this.reqByRoute)) {
      lines.push(`kr_requests_by_route_total{service="${service}",route="${route}"} ${v}`);
    }

    lines.push(`# HELP kr_requests_by_status_total Requests by status`);
    lines.push(`# TYPE kr_requests_by_status_total counter`);
    for (const [status, v] of Object.entries(this.reqByStatus)) {
      lines.push(`kr_requests_by_status_total{service="${service}",status="${status}"} ${v}`);
    }

    lines.push(`# HELP kr_rate_limited_total Rate limited requests`);
    lines.push(`# TYPE kr_rate_limited_total counter`);
    lines.push(`kr_rate_limited_total{service="${service}"} ${this.rateLimited}`);

    return lines.join("\n") + "\n";
  }
}

