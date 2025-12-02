/**
 * Models Routes
 *
 * Handles model-related operations including Ollama warmup
 */

import { Router } from 'express';

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:8b';

export function createModelsRoutes(): Router {
  const router = Router();

  /**
   * POST /api/models/ollama/warmup
   * Pre-warm Ollama model to reduce first-message latency
   *
   * Ollama loads models into memory on first use. This endpoint
   * triggers a minimal request to load the model before the user
   * sends their actual message.
   */
  router.post('/ollama/warmup', async (req, res) => {
    try {
      // Check if Ollama is available
      const tagsResponse = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      if (!tagsResponse.ok) {
        return res.status(503).json({
          success: false,
          error: 'Ollama server not available',
        });
      }

      const tagsData = await tagsResponse.json() as { models?: Array<{ name: string }> };
      const availableModels = tagsData.models?.map(m => m.name) || [];

      if (availableModels.length === 0) {
        return res.status(503).json({
          success: false,
          error: 'No models available on Ollama server',
        });
      }

      // Find the target model or use first available
      const targetModel = availableModels.includes(OLLAMA_MODEL)
        ? OLLAMA_MODEL
        : availableModels[0];

      // Send a minimal generate request to load the model
      // Using /api/generate with keep_alive is the official way to warm models
      const warmupResponse = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          prompt: '', // Empty prompt - just loads the model
          keep_alive: '5m', // Keep model in memory for 5 minutes
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout for model loading
      });

      if (!warmupResponse.ok) {
        throw new Error(`Warmup failed: ${warmupResponse.status}`);
      }

      // Stream the response to completion (model loading happens here)
      const reader = warmupResponse.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      console.log(`🔥 Ollama model ${targetModel} warmed up successfully`);

      res.json({
        success: true,
        model: targetModel,
        message: 'Model loaded into memory',
      });
    } catch (error: any) {
      console.error('Ollama warmup failed:', error.message);

      // Don't fail the request - warmup is optional optimization
      res.status(200).json({
        success: false,
        error: error.message || 'Warmup failed',
        message: 'Warmup failed but chat may still work',
      });
    }
  });

  /**
   * GET /api/models/ollama/status
   * Check Ollama availability and list models
   */
  router.get('/ollama/status', async (req, res) => {
    try {
      const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return res.json({
          available: false,
          error: 'Ollama server not responding',
        });
      }

      const data = await response.json() as { models?: Array<{ name: string }> };

      res.json({
        available: true,
        models: data.models?.map(m => m.name) || [],
        defaultModel: OLLAMA_MODEL,
      });
    } catch (error: any) {
      res.json({
        available: false,
        error: error.message || 'Failed to connect to Ollama',
      });
    }
  });

  return router;
}
