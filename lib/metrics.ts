interface MetricLabels {
  [key: string]: string | number;
}

interface Metric {
  name: string;
  type: "counter" | "gauge" | "histogram";
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 10000; // Prevent memory leak

  recordCounter(name: string, value: number = 1, labels?: MetricLabels): void {
    this.addMetric({
      name,
      type: "counter",
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    this.addMetric({
      name,
      type: "gauge",
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    this.addMetric({
      name,
      type: "histogram",
      value,
      labels,
      timestamp: new Date(),
    });
  }

  private addMetric(metric: Metric): void {
    this.metrics.push(metric);

    // Trim old metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // In production, you'd send these to a metrics backend
    if (process.env.NODE_ENV === "development") {
      console.debug(`[METRIC] ${metric.type.toUpperCase()} ${metric.name}=${metric.value}`, metric.labels);
    }
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
  }
}

export const metrics = new MetricsCollector();

// Helper to measure async function execution time
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: MetricLabels
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metrics.recordHistogram(`${name}_duration_ms`, duration, { ...labels, status: "success" });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metrics.recordHistogram(`${name}_duration_ms`, duration, { ...labels, status: "error" });
    throw error;
  }
}
