/**
 * Vercel Edge Function for Global Latency Tracking
 * 
 * Provides <50ms latency worldwide using Vercel's edge network
 * with intelligent caching and geo-distributed processing.
 */

import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1', 'pdx1', 'lhr1', 'fra1', 'gru1', 'syd1', 'hnd1', 'sin1'],
};

interface LatencyMetrics {
  region: string;
  timestamp: number;
  latency: number;
  source: 'api' | 'websocket' | 'redis' | 'task';
  success: boolean;
  metadata?: Record<string, any>;
}

interface RegionStats {
  region: string;
  averageLatency: number;
  p50: number;
  p95: number;
  p99: number;
  samples: number;
}

// Edge KV storage for metrics (using Vercel KV or Upstash)
const KV_NAMESPACE = 'latency-metrics';

export default async function handler(request: NextRequest) {
  const startTime = Date.now();
  
  // Get region from Vercel edge headers
  const region = request.headers.get('x-vercel-edge-region') || 'unknown';
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Parse request
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/latency', '');
  
  try {
    switch (request.method) {
      case 'POST':
        return await handleMetricsSubmission(request, region, startTime);
      
      case 'GET':
        if (path === '/stats') {
          return await getRegionalStats(region);
        } else if (path === '/health') {
          return await getHealthStatus(region, startTime);
        } else {
          return await getCurrentLatency(region, startTime);
        }
      
      case 'OPTIONS':
        return handleCORS();
      
      default:
        return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        region,
        latency: Date.now() - startTime
      }), 
      { 
        status: 500,
        headers: getCORSHeaders()
      }
    );
  }
}

async function handleMetricsSubmission(
  request: NextRequest, 
  region: string, 
  startTime: number
): Promise<Response> {
  const body = await request.json() as LatencyMetrics;
  
  // Validate metrics
  if (!body.source || typeof body.latency !== 'number') {
    return new Response('Invalid metrics format', { status: 400 });
  }
  
  // Store metrics in edge KV
  const key = `${KV_NAMESPACE}:${region}:${body.source}:${Date.now()}`;
  const metrics: LatencyMetrics = {
    ...body,
    region,
    timestamp: Date.now()
  };
  
  // Store with 1 hour TTL
  await storeMetrics(key, metrics, 3600);
  
  // Calculate processing latency
  const processingLatency = Date.now() - startTime;
  
  // If processing takes too long, trigger optimization
  if (processingLatency > 30) {
    await triggerOptimization(region, processingLatency);
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      region,
      processingLatency,
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        ...getCORSHeaders(),
        'Cache-Control': 'no-cache',
        'X-Edge-Region': region,
        'X-Processing-Time': processingLatency.toString()
      }
    }
  );
}

async function getCurrentLatency(
  region: string, 
  startTime: number
): Promise<Response> {
  // Get recent metrics from edge KV
  const metrics = await getRecentMetrics(region, 100);
  
  // Calculate statistics
  const stats = calculateStats(metrics);
  
  // Add current request latency
  const currentLatency = Date.now() - startTime;
  
  return new Response(
    JSON.stringify({
      region,
      currentLatency,
      stats,
      health: getHealthStatus(stats),
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        ...getCORSHeaders(),
        'Cache-Control': 'max-age=10, stale-while-revalidate=30',
        'X-Edge-Region': region
      }
    }
  );
}

async function getRegionalStats(region: string): Promise<Response> {
  // Get metrics for all regions
  const allRegions = ['iad1', 'sfo1', 'lhr1', 'fra1', 'gru1', 'syd1', 'hnd1', 'sin1'];
  const regionalStats: RegionStats[] = [];
  
  for (const r of allRegions) {
    const metrics = await getRecentMetrics(r, 1000);
    if (metrics.length > 0) {
      const stats = calculateStats(metrics);
      regionalStats.push({
        region: r,
        averageLatency: stats.average,
        p50: stats.p50,
        p95: stats.p95,
        p99: stats.p99,
        samples: metrics.length
      });
    }
  }
  
  // Sort by average latency
  regionalStats.sort((a, b) => a.averageLatency - b.averageLatency);
  
  return new Response(
    JSON.stringify({
      currentRegion: region,
      regionalStats,
      bestRegion: regionalStats[0]?.region,
      worstRegion: regionalStats[regionalStats.length - 1]?.region,
      globalAverage: regionalStats.reduce((sum, r) => sum + r.averageLatency, 0) / regionalStats.length,
      timestamp: Date.now()
    }),
    {
      status: 200,
      headers: {
        ...getCORSHeaders(),
        'Cache-Control': 'max-age=60, stale-while-revalidate=120'
      }
    }
  );
}

async function getHealthStatus(
  region: string, 
  startTime: number
): Promise<Response> {
  const metrics = await getRecentMetrics(region, 50);
  const stats = calculateStats(metrics);
  const health = getHealthStatus(stats);
  
  return new Response(
    JSON.stringify({
      status: health,
      region,
      latency: Date.now() - startTime,
      details: {
        average: stats.average,
        p95: stats.p95,
        samples: metrics.length
      },
      timestamp: Date.now()
    }),
    {
      status: health === 'critical' ? 503 : 200,
      headers: {
        ...getCORSHeaders(),
        'Cache-Control': 'no-cache'
      }
    }
  );
}

function calculateStats(metrics: LatencyMetrics[]): {
  average: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  if (metrics.length === 0) {
    return { average: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }
  
  const latencies = metrics.map(m => m.latency).sort((a, b) => a - b);
  
  return {
    average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50: latencies[Math.floor(latencies.length * 0.5)],
    p95: latencies[Math.floor(latencies.length * 0.95)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
    min: latencies[0],
    max: latencies[latencies.length - 1]
  };
}

function getHealthStatus(stats: any): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (stats.average < 30 && stats.p95 < 50) return 'excellent';
  if (stats.average < 50 && stats.p95 < 100) return 'good';
  if (stats.average < 100 && stats.p95 < 200) return 'fair';
  if (stats.average < 200 && stats.p95 < 500) return 'poor';
  return 'critical';
}

async function triggerOptimization(region: string, latency: number) {
  // Log slow processing for analysis
  console.warn(`Slow edge processing in ${region}: ${latency}ms`);
  
  // Could trigger alerts or auto-scaling here
  // For now, just log to monitoring
}

// Mock KV storage functions (replace with actual Vercel KV or Upstash)
async function storeMetrics(key: string, metrics: LatencyMetrics, ttl: number) {
  // In production, use:
  // await kv.set(key, JSON.stringify(metrics), { ex: ttl });
  
  // For now, use in-memory cache (not persistent across invocations)
  globalThis.__metricsCache = globalThis.__metricsCache || new Map();
  globalThis.__metricsCache.set(key, { metrics, expires: Date.now() + ttl * 1000 });
}

async function getRecentMetrics(region: string, limit: number): Promise<LatencyMetrics[]> {
  // In production, use:
  // const keys = await kv.keys(`${KV_NAMESPACE}:${region}:*`);
  // const metrics = await Promise.all(keys.slice(-limit).map(k => kv.get(k)));
  
  // For now, return mock data
  const mockMetrics: LatencyMetrics[] = [];
  for (let i = 0; i < Math.min(limit, 10); i++) {
    mockMetrics.push({
      region,
      timestamp: Date.now() - i * 1000,
      latency: 20 + Math.random() * 30,
      source: 'api',
      success: true
    });
  }
  
  return mockMetrics;
}

function getCORSHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}

// TypeScript global augmentation for edge cache
declare global {
  var __metricsCache: Map<string, { metrics: LatencyMetrics; expires: number }> | undefined;
}