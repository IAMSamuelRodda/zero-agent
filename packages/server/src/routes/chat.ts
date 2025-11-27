/**
 * Chat API Routes
 *
 * Handles conversation with the AI agent
 * Replaces: Agent Lambda (functions/agent/)
 */

import { Router } from 'express';
import { AgentOrchestrator } from '@zero-agent/agent-core';
import type { DatabaseProvider } from '@zero-agent/core';

export function createChatRoutes(db: DatabaseProvider): Router {
  const router = Router();

  // Initialize orchestrator (singleton per server instance)
  const orchestrator = new AgentOrchestrator();

  /**
   * POST /api/chat
   * Send a message and get AI response
   */
  router.post('/', async (req, res, next) => {
    try {
      const { message, sessionId } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Missing required field: message',
        });
      }

      // For now, use a default user ID
      // TODO: Get from auth middleware when authentication is implemented
      const userId = req.headers['x-user-id'] as string || 'default-user';

      // Create session if not provided
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = await orchestrator.createSession(userId);
      }

      // Process message through orchestrator
      const response = await orchestrator.processMessage({
        userId,
        sessionId: activeSessionId,
        message,
      });

      res.json({
        message: response.message,
        sessionId: response.sessionId,
        metadata: response.metadata,
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/chat/stream (future)
   * Stream AI response for real-time updates
   */
  router.post('/stream', async (req, res, next) => {
    // TODO: Implement streaming response using Server-Sent Events
    res.status(501).json({
      error: 'Streaming not yet implemented',
    });
  });

  return router;
}
