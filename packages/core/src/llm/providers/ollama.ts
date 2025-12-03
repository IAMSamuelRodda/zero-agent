/**
 * Ollama Local LLM Provider Implementation
 *
 * Supports local models via Ollama (http://localhost:11434)
 * Free, private, runs on user's hardware
 * Models: llama3, mistral, codellama, etc.
 */

import type {
  LLMProvider,
  AuthConfig,
  Message,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  UsageMetrics,
} from "../types.js";
import { AuthenticationError, LLMProviderError } from "../types.js";

interface OllamaMessage {
  role: string;
  content: string;
}

// Ollama tool format (matches OpenAI function calling format)
interface OllamaToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

interface OllamaToolCall {
  id: string;
  function: {
    index?: number;
    name: string;
    arguments: Record<string, any>;
  };
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  tools?: OllamaToolDefinition[];
  options?: {
    temperature?: number;
    num_predict?: number;  // max_tokens equivalent
    stop?: string[];
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string | null;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Models known to support native function calling in Ollama
// Based on testing - models with tool_calls in response
const TOOL_CAPABLE_MODEL_PATTERNS = [
  'qwq',           // Qwen reasoning model - tested working
  'llama3.1',      // Llama 3.1 has tool support
  'llama3.2',      // Llama 3.2 has tool support
  'llama3:',       // Llama 3 base (most variants)
  'mistral',       // Mistral models support tools
  'qwen2.5',       // Qwen 2.5 has tool training
  'granite3',      // IBM Granite 3
];

/**
 * Check if a model name matches any tool-capable pattern
 */
export function isToolCapableModel(modelName: string): boolean {
  const normalized = modelName.toLowerCase();
  return TOOL_CAPABLE_MODEL_PATTERNS.some(pattern => normalized.includes(pattern));
}

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama" as const;
  readonly supportedModels = [
    "llama3:latest",
    "llama3:8b",
    "llama3:70b",
    "mistral:latest",
    "mistral:7b",
    "codellama:latest",
    "phi3:latest",
    "gemma2:latest",
  ];

  private endpoint: string = "http://localhost:11434";
  private isConnected: boolean = false;
  private defaultModel = process.env.OLLAMA_MODEL || "llama3:8b";
  private usageStats: UsageMetrics = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    costUsd: 0,  // Local models are free!
  };

  async authenticate(config: AuthConfig): Promise<void> {
    if (config.method !== "local") {
      throw new AuthenticationError(
        this.name,
        "Ollama only supports local authentication method"
      );
    }

    // Use custom endpoint if provided, otherwise default
    this.endpoint = config.credentials?.endpoint || this.endpoint;

    try {
      // Test connection to Ollama server
      const response = await fetch(`${this.endpoint}/api/tags`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { models?: Array<{ name: string }> };

      // Check if any models are available
      if (!data.models || data.models.length === 0) {
        throw new Error(
          "No models available. Pull a model first: ollama pull llama3"
        );
      }

      // Auto-select model if default not available
      const availableModels = data.models.map(m => m.name);
      if (!availableModels.includes(this.defaultModel)) {
        // Use first available model as fallback
        this.defaultModel = availableModels[0];
        console.log(`ℹ Ollama using available model: ${this.defaultModel}`);
      }

      this.isConnected = true;
    } catch (error: any) {
      this.isConnected = false;

      throw new AuthenticationError(
        this.name,
        `Failed to connect to Ollama at ${this.endpoint}. Is Ollama running? Error: ${error.message}`,
        error
      );
    }
  }

  async chat(
    messages: Message[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    if (!this.isConnected) {
      throw new LLMProviderError(
        "Provider not authenticated. Call authenticate() first.",
        this.name
      );
    }

    const modelToUse = options?.model || this.defaultModel;
    const supportsTools = isToolCapableModel(modelToUse);

    console.log(`🤖 Ollama chat: model=${modelToUse}, tools=${supportsTools ? 'enabled' : 'disabled'}`);

    // Convert tools to Ollama format if model supports them
    let ollamaTools: OllamaToolDefinition[] | undefined;
    if (supportsTools && options?.tools && options.tools.length > 0) {
      ollamaTools = options.tools.map(tool => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object" as const,
            properties: tool.input_schema.properties,
            required: tool.input_schema.required,
          },
        },
      }));
      console.log(`🔧 Passing ${ollamaTools.length} tools to Ollama`);
    }

    const requestBody: OllamaChatRequest = {
      model: modelToUse,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: false,
      tools: ollamaTools,
      options: {
        temperature: options?.temperature,
        num_predict: options?.maxTokens,
        stop: options?.stopSequences,
      },
    };

    try {
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as OllamaChatResponse;

      // Ollama doesn't provide exact token counts, estimate from eval counts
      const inputTokens = data.prompt_eval_count || 0;
      const outputTokens = data.eval_count || 0;

      // Update usage stats
      this.usageStats.inputTokens += inputTokens;
      this.usageStats.outputTokens += outputTokens;
      this.usageStats.totalTokens += inputTokens + outputTokens;

      // Check for tool calls in response
      let toolUse: ChatResponse['toolUse'] | undefined;
      if (data.message.tool_calls && data.message.tool_calls.length > 0) {
        const toolCall = data.message.tool_calls[0]; // Handle first tool call
        console.log(`🔧 Ollama tool call: ${toolCall.function.name}`, toolCall.function.arguments);
        toolUse = {
          type: "tool_use",
          id: toolCall.id || `ollama-tool-${Date.now()}`,
          name: toolCall.function.name,
          input: toolCall.function.arguments,
        };
      }

      return {
        id: `ollama-${Date.now()}`,
        content: data.message.content || '',
        model: data.model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd: 0,  // Local models are free!
        },
        finishReason: toolUse ? "tool_use" : (data.done ? "stop" : undefined),
        toolUse,
      };
    } catch (error: any) {
      throw new LLMProviderError(
        `Ollama API request failed: ${error.message}`,
        this.name,
        error
      );
    }
  }

  async *streamChat(
    messages: Message[],
    options?: ChatOptions
  ): AsyncIterator<ChatChunk> {
    if (!this.isConnected) {
      throw new LLMProviderError(
        "Provider not authenticated. Call authenticate() first.",
        this.name
      );
    }

    const requestBody: OllamaChatRequest = {
      model: options?.model || this.defaultModel,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      options: {
        temperature: options?.temperature,
        num_predict: options?.maxTokens,
        stop: options?.stopSequences,
      },
    };

    try {
      const response = await fetch(`${this.endpoint}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            const data = JSON.parse(line) as OllamaChatResponse;

            if (data.message?.content) {
              yield {
                content: data.message.content,
                isComplete: false,
              };
            }

            if (data.done) {
              // Update usage stats
              const inputTokens = data.prompt_eval_count || 0;
              const outputTokens = data.eval_count || 0;
              this.usageStats.inputTokens += inputTokens;
              this.usageStats.outputTokens += outputTokens;
              this.usageStats.totalTokens += inputTokens + outputTokens;

              yield {
                content: "",
                isComplete: true,
              };
            }
          } catch (parseError) {
            console.error("Failed to parse Ollama stream chunk:", line);
          }
        }
      }
    } catch (error: any) {
      throw new LLMProviderError(
        `Ollama stream failed: ${error.message}`,
        this.name,
        error
      );
    }
  }

  async getUsage(): Promise<UsageMetrics> {
    return { ...this.usageStats };
  }

  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * List available models on the Ollama server
   */
  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as { models?: Array<{ name: string }> };
      return data.models?.map((m) => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Pull a new model from Ollama registry
   */
  async pullModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}/api/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Stream the pull progress
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log("Pulling model:", chunk);
        }
      }
    } catch (error: any) {
      throw new LLMProviderError(
        `Failed to pull model ${modelName}: ${error.message}`,
        this.name,
        error
      );
    }
  }
}
