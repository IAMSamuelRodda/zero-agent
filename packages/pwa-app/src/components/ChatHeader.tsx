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
  projectName?: string; // Project name for breadcrumb
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
  projectName,
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

  // Display title with breadcrumb if in a project
  const displayTitle = projectName ? `${projectName} / ${title}` : title;

  return (
    <header className="sticky top-0 z-20 bg-arc-bg-primary">
      <div className="px-4 py-3">
        <ChatActionsMenu
          sessionId={sessionId}
          title={displayTitle}
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
