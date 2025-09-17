/**
 * Vercel Edge Function for Metrics Aggregation
 * 
 * Aggregates and serves performance metrics from multiple sources
 * with global distribution and intelligent caching.
 */

import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'lhr1', 'hnd1'], // Strategic regions for global coverage
};

interface MetricsPayload {
  source: string;
  metrics: Record<string, any>;
  timestamp: number;
  region?: string;
}

interface AggregatedMetrics {
  sources: string[];
  aggregations: {
    latency: {
      global: number;
      byRegion: Record<string, number>;
      bySource: Record<string, number>;
    };
    throughput: {
      requestsPerSecond: number;
      bytesPerSecond: number;
    };
    errors: {
      rate: number;
      count: number;
      byType: Record<string, number>;
    };
    cache: {
      hitRate: number;
      missRate: number;
      evictions: number;
    };
  };
  timestamp: number;
  region: string;
}

export default async function handler(request: NextRequest) {
  const startTime = Date.now();
  const region = request.headers.get('x-vercel-edge-region') || 'unknown';
  
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/metrics', '');
    
    switch (request.method) {
      case 'POST':
        return await ingestMetrics(request, region);
      
      case 'GET':
        switch (path) {
          case '/aggregate':
            return await getAggregatedMetrics(url.searchParams, region);
          case '/stream':
            return await streamMetrics(region);
          case '/export':
            return await exportMetrics(url.searchParams, region);
          default:
            return await getMetricsSummary(region);
        }
      
      case 'OPTIONS':
        return handleCORS();
      
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Metrics edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', region }),
      { status: 500, headers: getCORSHeaders() }
    );
  }
}

async function ingestMetrics(request: NextRequest, region: string): Promise<Response> {
  const payload = await request.json() as MetricsPayload;
  
  // Validate payload
  if (!payload.source || !payload.metrics) {
    return new Response('Invalid metrics payload', { status: 400 });
  }
  
  // Process and store metrics
  const processed = await processMetrics(payload, region);
  
  // Store in edge KV with TTL
  const key = `metrics:${region}:${payload.source}:${Date.now()}`;
  await storeInKV(key, processed, 3600); // 1 hour TTL
  
  // If critical metrics, trigger alerts
  await checkThresholds(processed);
  
  return new Response(
    JSON.stringify({
      success: true,
      region,
      processed: Object.keys(processed).length,
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        ...getCORSHeaders(),
        'X-Edge-Region': region
      }
    }
  );
}

async function getAggregatedMetrics(
  params: URLSearchParams,
  region: string
): Promise<Response> {
  const timeRange = params.get('range') || '1h';
  const sources = params.get('sources')?.split(',') || ['all'];
  const granularity = params.get('granularity') || '1m';
  
  // Fetch metrics from KV
  const metrics = await fetchMetricsFromKV(timeRange, sources, region);
  
  // Aggregate metrics
  const aggregated = aggregateMetrics(metrics);
  
  return new Response(
    JSON.stringify({
      timeRange,
      sources,
      granularity,
      region,
      aggregated,
      sampleCount: metrics.length,
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        ...getCORSHeaders(),
        'Cache-Control': 'max-age=30, stale-while-revalidate=60'
      }
    }
  );
}

async function streamMetrics(region: string): Promise<Response> {
  // Create a TransformStream for server-sent events
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Start streaming metrics
  const interval = setInterval(async () => {
    try {
      const metrics = await getLatestMetrics(region);
      const data = `data: ${JSON.stringify(metrics)}\n\n`;
      await writer.write(encoder.encode(data));
    } catch (error) {
      clearInterval(interval);
      await writer.close();
    }
  }, 1000); // Stream every second
  
  // Clean up after 60 seconds
  setTimeout(() => {
    clearInterval(interval);
    writer.close();
  }, 60000);
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...getCORSHeaders()
    }
  });
}

async function exportMetrics(
  params: URLSearchParams,
  region: string
): Promise<Response> {
  const format = params.get('format') || 'json';
  const timeRange = params.get('range') || '1h';
  
  // Fetch metrics
  const metrics = await fetchMetricsFromKV(timeRange, ['all'], region);
  
  // Format based on requested type
  let output: string;
  let contentType: string;
  
  switch (format) {
    case 'prometheus':
      output = formatPrometheus(metrics);
      contentType = 'text/plain';
      break;
    
    case 'csv':
      output = formatCSV(metrics);
      contentType = 'text/csv';
      break;
    
    case 'json':
    default:
      output = JSON.stringify(metrics, null, 2);
      contentType = 'application/json';
      break;
  }
  
  return new Response(output, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="metrics-${Date.now()}.${format}"`,
      ...getCORSHeaders()
    }
  });
}

async function getMetricsSummary(region: string): Promise<Response> {
  const summary = {
    region,
    status: 'healthy',
    uptime: process.uptime ? process.uptime() : 0,
    metrics: {
      latency: {
        current: 25,
        average: 35,
        p95: 48,
        p99: 62
      },
      throughput: {
        requestsPerSecond: 1250,
        bytesPerSecond: 524288
      },
      errors: {
        rate: 0.001,
        last24h: 42
      },
      cache: {
        hitRate: 0.87,
        size: '12.4 MB',
        entries: 3421
      }
    },
    timestamp: Date.now()
  };
  
  return new Response(
    JSON.stringify(summary),
    {
      status: 200,
      headers: {
        ...getCORSHeaders(),
        'Cache-Control': 'max-age=10'
      }
    }
  );
}

// Helper functions
async function processMetrics(
  payload: MetricsPayload,
  region: string
): Promise<Record<string, any>> {
  return {
    ...payload.metrics,
    _metadata: {
      source: payload.source,
      region,
      timestamp: payload.timestamp || Date.now(),
      processed: Date.now()
    }
  };
}

async function checkThresholds(metrics: Record<string, any>) {
  // Check for critical thresholds
  if (metrics.latency?.p99 > 200) {
    console.warn('High P99 latency detected:', metrics.latency.p99);
    // Trigger alert
  }
  
  if (metrics.errors?.rate > 0.05) {
    console.error('High error rate detected:', metrics.errors.rate);
    // Trigger alert
  }
}

function aggregateMetrics(metrics: any[]): AggregatedMetrics {
  // Perform aggregation logic
  const sources = [...new Set(metrics.map(m => m._metadata?.source))];
  
  return {
    sources,
    aggregations: {
      latency: {
        global: calculateAverage(metrics, 'latency.average'),
        byRegion: groupByRegion(metrics, 'latency.average'),
        bySource: groupBySource(metrics, 'latency.average')
      },
      throughput: {
        requestsPerSecond: calculateSum(metrics, 'throughput.rps'),
        bytesPerSecond: calculateSum(metrics, 'throughput.bps')
      },
      errors: {
        rate: calculateAverage(metrics, 'errors.rate'),
        count: calculateSum(metrics, 'errors.count'),
        byType: groupByType(metrics, 'errors.types')
      },
      cache: {
        hitRate: calculateAverage(metrics, 'cache.hitRate'),
        missRate: calculateAverage(metrics, 'cache.missRate'),
        evictions: calculateSum(metrics, 'cache.evictions')
      }
    },
    timestamp: Date.now(),
    region: metrics[0]?._metadata?.region || 'unknown'
  };
}

function formatPrometheus(metrics: any[]): string {
  const lines: string[] = [];
  
  metrics.forEach(m => {
    if (m.latency?.average) {
      lines.push(`latency_average{source="${m._metadata.source}",region="${m._metadata.region}"} ${m.latency.average}`);
    }
    if (m.throughput?.rps) {
      lines.push(`throughput_rps{source="${m._metadata.source}"} ${m.throughput.rps}`);
    }
  });
  
  return lines.join('\n');
}

function formatCSV(metrics: any[]): string {
  const headers = ['timestamp', 'source', 'region', 'latency', 'throughput', 'errors'];
  const rows = metrics.map(m => [
    m._metadata.timestamp,
    m._metadata.source,
    m._metadata.region,
    m.latency?.average || 0,
    m.throughput?.rps || 0,
    m.errors?.rate || 0
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Utility functions
function calculateAverage(metrics: any[], path: string): number {
  const values = metrics.map(m => getNestedValue(m, path)).filter(v => v !== undefined);
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function calculateSum(metrics: any[], path: string): number {
  return metrics.reduce((sum, m) => sum + (getNestedValue(m, path) || 0), 0);
}

function groupByRegion(metrics: any[], path: string): Record<string, number> {
  const grouped: Record<string, number[]> = {};
  
  metrics.forEach(m => {
    const region = m._metadata?.region || 'unknown';
    const value = getNestedValue(m, path);
    if (value !== undefined) {
      grouped[region] = grouped[region] || [];
      grouped[region].push(value);
    }
  });
  
  const result: Record<string, number> = {};
  Object.entries(grouped).forEach(([region, values]) => {
    result[region] = values.reduce((a, b) => a + b, 0) / values.length;
  });
  
  return result;
}

function groupBySource(metrics: any[], path: string): Record<string, number> {
  const grouped: Record<string, number[]> = {};
  
  metrics.forEach(m => {
    const source = m._metadata?.source || 'unknown';
    const value = getNestedValue(m, path);
    if (value !== undefined) {
      grouped[source] = grouped[source] || [];
      grouped[source].push(value);
    }
  });
  
  const result: Record<string, number> = {};
  Object.entries(grouped).forEach(([source, values]) => {
    result[source] = values.reduce((a, b) => a + b, 0) / values.length;
  });
  
  return result;
}

function groupByType(metrics: any[], path: string): Record<string, number> {
  const result: Record<string, number> = {};
  
  metrics.forEach(m => {
    const types = getNestedValue(m, path);
    if (types && typeof types === 'object') {
      Object.entries(types).forEach(([type, count]) => {
        result[type] = (result[type] || 0) + (count as number);
      });
    }
  });
  
  return result;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Mock KV functions (replace with actual Vercel KV)
async function storeInKV(key: string, data: any, ttl: number) {
  // In production: await kv.set(key, JSON.stringify(data), { ex: ttl });
  console.log(`Storing ${key} with TTL ${ttl}`);
}

async function fetchMetricsFromKV(
  timeRange: string,
  sources: string[],
  region: string
): Promise<any[]> {
  // Mock implementation
  return Array(10).fill(null).map((_, i) => ({
    latency: { average: 30 + Math.random() * 20 },
    throughput: { rps: 1000 + Math.random() * 500 },
    errors: { rate: Math.random() * 0.01 },
    cache: { hitRate: 0.8 + Math.random() * 0.15 },
    _metadata: {
      source: sources[0] === 'all' ? 'api' : sources[0],
      region,
      timestamp: Date.now() - i * 60000
    }
  }));
}

async function getLatestMetrics(region: string): Promise<any> {
  return {
    region,
    latency: 25 + Math.random() * 10,
    throughput: 1200 + Math.random() * 200,
    timestamp: Date.now()
  };
}

function getCORSHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}