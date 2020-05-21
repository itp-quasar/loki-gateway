export type EpochNs = string; // Example: "1570818238000000000"
export type Value = [EpochNs, string];

export class Batch {
  private values: Value[] = [];

  constructor(private labels: Record<string, string>) {}

  add(timestamp: EpochNs, log: string) {
    this.values.push([timestamp, log]);
  }

  size() {
    return this.values.length;
  }

  toJson(): string {
    // See https://github.com/grafana/loki/blob/master/docs/api.md#post-lokiapiv1push
    return JSON.stringify({
      streams: [
        {
          stream: this.labels,
          values: this.values,
        },
      ],
    });
  }
}
