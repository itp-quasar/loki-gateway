import { Batch, EpochNs } from "./batch.ts";

export interface Labels extends Record<string, string> {
  // Each replica has it's own stream to avoid out-of-order timestamps.
  // Try to minimise the number of gateways to keep Loki's performance high
  gateway: string;
  label: string;
}

export interface FlushConfig {
  interval: number;
  maxSize: number;
}

export interface LokiServiceInit {
  host: string;
  port: string;
  labels: Labels;
  flush: {
    interval: number;
    maxSize: number;
  };
}

export class LokiService {
  private origin: string;
  private labels: Labels;
  private flushConfig: FlushConfig;
  private flushTask: number;

  private batch: Batch;

  constructor(init: LokiServiceInit) {
    this.origin = `http://${init.host}:${init.port}`;
    this.labels = init.labels;
    this.batch = new Batch(this.labels);
    this.flushConfig = init.flush;
    this.flushTask = setInterval(this.flush, this.flushConfig.interval);
  }

  stop() {
    clearInterval(this.flushTask);
  }

  async log(message: string) {
    // To avoid out-of-order logs due to network latency we add a timestamp here.
    // See https://grafana.com/blog/2020/04/21/how-labels-in-loki-can-make-log-queries-faster-and-easier/#6-logs-must-be-in-increasing-time-order-per-stream
    const timestamp: EpochNs = `${Date.now() * 1_000_000}`;
    this.batch.add(timestamp, message);

    if (this.batch.size() > this.flushConfig.maxSize) {
      this.flush();
    }
  }

  async flush() {
    const batch = this.batch;
    this.batch = new Batch(this.labels);
    await this.push(batch);
  }

  private push(batch: Batch) {
    return fetch(`${this.origin}/loki/api/v1/push`, {
      method: "POST",
      cache: "no-cache",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
      },
      body: batch.toJson(),
    });
  }
}
