/**
 * Health Check Routes
 *
 * Provides health and readiness endpoints for monitoring
 */

import { Router } from 'express';
import type { DatabaseProvider } from '@pip/core';

export function createHealthRoutes(db: DatabaseProvider): Router {
  const router = Router();
  const startTime = Date.now();

  /**
   * GET /health
   * Basic health check
   */
  router.get('/', (req, res) => {
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /health/ready
   * Readiness check (verifies dependencies)
   */
  router.get('/ready', async (req, res) => {
    const checks: Record<string, boolean> = {
      database: false,
      xeroConfigured: false,
      anthropicConfigured: false,
    };

    try {
      // Check database connection
      checks.database = db.isConnected();

      // Check Xero credentials
      checks.xeroConfigured = !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET);

      // Check Anthropic API key
      checks.anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

      const allHealthy = Object.values(checks).every(v => v);

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ready' : 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /health/live
   * Liveness check (is the process running)
   */
  router.get('/live', (req, res) => {
    res.json({
      status: 'alive',
      pid: process.pid,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
