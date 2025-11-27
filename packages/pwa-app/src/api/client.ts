/**
 * API Client for Zero Agent backend
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ChatResponse {
  message: string;
  sessionId: string;
  metadata?: {
    tokensUsed?: number;
  };
}

interface AuthStatus {
  connected: boolean;
  expired?: boolean;
  tenantName?: string;
  tenantId?: string;
}

interface DocumentInfo {
  name: string;
  type: string;
  chunks: number;
  totalChars: number;
}

interface DocumentListItem {
  docName: string;
  docType: string;
  chunkCount: number;
  createdAt: number;
}

export const api = {
  /**
   * Send a chat message
   */
  async chat(message: string, sessionId?: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.details || error.error || 'Chat request failed');
    }

    return response.json();
  },

  /**
   * Check Xero authentication status
   */
  async getAuthStatus(): Promise<AuthStatus> {
    const response = await fetch(`${API_BASE}/auth/status`);
    if (!response.ok) {
      throw new Error('Failed to check auth status');
    }
    return response.json();
  },

  /**
   * Get Xero OAuth URL
   */
  getXeroAuthUrl(): string {
    return `${API_BASE}/auth/xero`;
  },

  /**
   * Check server health
   */
  async health(): Promise<{ status: string; uptime: number }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  /**
   * Upload a business context document
   */
  async uploadDocument(file: File, docType?: string): Promise<{ success: boolean; document: DocumentInfo }> {
    const formData = new FormData();
    formData.append('file', file);
    if (docType) {
      formData.append('docType', docType);
    }

    const response = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Document upload failed');
    }

    return response.json();
  },

  /**
   * List uploaded documents
   */
  async listDocuments(): Promise<{ documents: DocumentListItem[] }> {
    const response = await fetch(`${API_BASE}/api/documents`);
    if (!response.ok) {
      throw new Error('Failed to list documents');
    }
    return response.json();
  },

  /**
   * Delete a document
   */
  async deleteDocument(docName: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(docName)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  },
};
