/**
 * ChatHeader - Seamless header with chat title dropdown
 * Pattern: Claude.ai - title is the action menu trigger
 * Background matches main content for seamless scroll effect
 */

import { ChatActionsMenu } from './ChatActionsMenu';

// ============================================================================
// Types
// ============================================================================

interface ChatHeaderProps {
  sessionId: string | null;
  title: string;
  isBookmarked?: boolean;
  hasMessages: boolean;
  onBookmark: (sessionId: string) => Promise<void>;
  onRename: (sessionId: string, newTitle: string) => Promise<void>;
  onAddToProject?: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export function ChatHeader({
  sessionId,
  title,
  isBookmarked = false,
  hasMessages,
  onBookmark,
  onRename,
  onAddToProject,
  onDelete,
}: ChatHeaderProps) {
  // Only show header with dropdown when there's an active chat
  if (!hasMessages || !sessionId) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 bg-arc-bg-primary">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <ChatActionsMenu
          sessionId={sessionId}
          title={title}
          isBookmarked={isBookmarked}
          onBookmark={onBookmark}
          onRename={onRename}
          onAddToProject={onAddToProject}
          onDelete={onDelete}
          variant="dropdown"
          menuPosition="bottom-left"
        />
      </div>
    </header>
  );
}
