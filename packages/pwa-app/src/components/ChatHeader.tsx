/**
 * ChatHeader - Seamless header with chat title dropdown
 * Pattern: Claude.ai - title is the action menu trigger
 * Background matches main content for seamless scroll effect
 */

import { ChatActionsMenu } from './ChatActionsMenu';

// ============================================================================
// Icons
// ============================================================================

// Official Pip Logo (matches favicon.svg)
const PipLogo = () => (
  <svg className="w-7 h-7" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="44" fill="#0f1419" stroke="#7eb88e" strokeWidth="6"/>
    <path d="M38 70 V30 h14 a10 10 0 0 1 0 20 H38" fill="none" stroke="#7eb88e" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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
  return (
    <header className="sticky top-0 z-10 bg-arc-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center">
        {hasMessages && sessionId ? (
          // Active chat: Title dropdown with actions
          <div className="flex items-center gap-2">
            <PipLogo />
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
        ) : (
          // Empty state: Just logo and "Pip"
          <div className="flex items-center gap-2">
            <PipLogo />
            <span className="text-base font-medium text-arc-text-primary">Pip</span>
          </div>
        )}
      </div>
    </header>
  );
}
