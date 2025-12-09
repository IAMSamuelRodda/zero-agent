/**
 * ChatHeader - Seamless header with chat title dropdown
 * Pattern: Claude.ai - title is the action menu trigger
 * Background matches main content for seamless scroll effect
 */

import { ChatActionsMenu } from './ChatActionsMenu';

// ============================================================================
// Icons
// ============================================================================

const ChevronRightIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ============================================================================
// Types
// ============================================================================

interface ChatHeaderProps {
  sessionId: string | null;
  title: string;
  projectName?: string; // Project name for breadcrumb
  projectId?: string; // Project ID for breadcrumb link
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
  projectId,
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
    <header className="sticky top-0 z-20 bg-arc-bg-primary">
      <div className="px-4 py-3 flex items-center gap-1.5">
        {/* Breadcrumb - clickable project name */}
        {projectName && projectId && (
          <>
            <a
              href={`/projects/${projectId}`}
              className="text-sm text-arc-text-secondary hover:text-arc-text-primary transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/projects/${projectId}`;
              }}
            >
              {projectName}
            </a>
            <span className="text-arc-text-dim">
              <ChevronRightIcon />
            </span>
          </>
        )}

        {/* Chat title dropdown */}
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
