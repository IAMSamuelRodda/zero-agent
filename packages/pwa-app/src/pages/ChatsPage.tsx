/**
 * Chats Page - Full chat history browser
 * Claude.ai pattern: Shows ALL chats, with optional project filter
 * Chats can be moved to/from projects
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useProjectStore } from '../store/projectStore';
import { api } from '../api/client';
import { MainLayout } from '../components/MainLayout';

// ============================================================================
// Icons
// ============================================================================

const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const BookmarkIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const MoveIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12h22M17 6l6 6-6 6" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export function ChatsPage() {
  const navigate = useNavigate();
  const {
    chatList,
    isLoadingList,
    loadChatList,
    loadChat,
    deleteChat,
    bookmarkChat,
  } = useChatStore();

  const { projects, loadProjects } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string | null | undefined>(undefined); // undefined = all, null = no project, string = specific project
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [moveToProjectFor, setMoveToProjectFor] = useState<string | null>(null);

  // Load chats and projects on mount
  useEffect(() => {
    // Load ALL chats (no project filter)
    loadChatList();
    loadProjects();
  }, [loadChatList, loadProjects]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setMenuOpenFor(null);
      setShowFilterDropdown(false);
      setMoveToProjectFor(null);
    };
    if (menuOpenFor || showFilterDropdown || moveToProjectFor) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [menuOpenFor, showFilterDropdown, moveToProjectFor]);

  // Get project name by ID
  const getProjectName = (projectId: string | null | undefined) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || null;
  };

  // Filter chats by search query and project
  const filteredChats = useMemo(() => {
    let filtered = chatList;

    // Filter by project
    if (filterProjectId !== undefined) {
      filtered = filtered.filter(chat => chat.projectId === filterProjectId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (chat) =>
          chat.title.toLowerCase().includes(query) ||
          (chat.previewText && chat.previewText.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [chatList, searchQuery, filterProjectId]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Toggle chat selection
  const toggleSelect = (sessionId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedChats(newSelected);
  };

  // Select all visible chats
  const selectAll = () => {
    if (selectedChats.size === filteredChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(filteredChats.map((c) => c.sessionId)));
    }
  };

  // Delete selected chats
  const deleteSelected = async () => {
    if (selectedChats.size === 0) return;
    if (!confirm(`Delete ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}?`)) return;

    for (const sessionId of selectedChats) {
      await deleteChat(sessionId);
    }
    setSelectedChats(new Set());
  };

  // Handle chat click - load and navigate
  const handleChatClick = async (sessionId: string) => {
    await loadChat(sessionId);
    navigate('/');
  };

  // Handle delete single chat
  const handleDeleteChat = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      await deleteChat(sessionId);
    }
    setMenuOpenFor(null);
  };

  // Handle bookmark toggle
  const handleBookmark = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await bookmarkChat(sessionId);
    setMenuOpenFor(null);
  };

  // Handle move to project
  const handleMoveToProject = async (sessionId: string, projectId: string | null) => {
    try {
      await api.moveToProject(sessionId, projectId);
      // Refresh chat list
      loadChatList();
    } catch (err) {
      console.error('Failed to move chat to project:', err);
    }
    setMoveToProjectFor(null);
    setMenuOpenFor(null);
  };

  // Get filter label
  const getFilterLabel = () => {
    if (filterProjectId === undefined) return 'All Chats';
    if (filterProjectId === null) return 'General';
    return getProjectName(filterProjectId) || 'Project';
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-arc-bg-secondary border-b border-arc-border sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Back button */}
              <button
                onClick={() => navigate('/')}
                className="p-1.5 rounded hover:bg-arc-bg-tertiary text-arc-text-secondary transition-colors"
                title="Back to chat"
              >
                <ChevronLeftIcon />
              </button>

              {/* Title and count */}
              <div className="flex-1">
                <h1 className="text-lg font-medium text-arc-text-primary">Chats</h1>
                <p className="text-xs text-arc-text-dim">
                  {chatList.length} conversation{chatList.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Bulk actions */}
              {selectedChats.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-arc-text-secondary">
                    {selectedChats.size} selected
                  </span>
                  <button
                    onClick={deleteSelected}
                    className="p-2 rounded hover:bg-red-900/30 text-red-400 transition-colors"
                    title="Delete selected"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>

            {/* Search and Filter */}
            <div className="mt-3 flex gap-2">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-arc-text-dim">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-arc-bg-tertiary border border-arc-border rounded-lg pl-10 pr-4 py-2 text-sm text-arc-text-primary placeholder-arc-text-dim focus:outline-none focus:border-arc-accent"
                />
              </div>

              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilterDropdown(!showFilterDropdown);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filterProjectId !== undefined
                      ? 'bg-arc-accent/10 border-arc-accent/30 text-arc-accent'
                      : 'bg-arc-bg-tertiary border-arc-border text-arc-text-secondary hover:text-arc-text-primary'
                  }`}
                >
                  <FilterIcon />
                  <span className="hidden sm:inline">{getFilterLabel()}</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-arc-bg-tertiary border border-arc-border rounded-lg shadow-lg z-20 py-1 min-w-40">
                    <button
                      onClick={() => {
                        setFilterProjectId(undefined);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        filterProjectId === undefined
                          ? 'bg-arc-accent/10 text-arc-accent'
                          : 'text-arc-text-primary hover:bg-arc-bg-secondary'
                      }`}
                    >
                      All Chats
                    </button>
                    <button
                      onClick={() => {
                        setFilterProjectId(null);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        filterProjectId === null
                          ? 'bg-arc-accent/10 text-arc-accent'
                          : 'text-arc-text-primary hover:bg-arc-bg-secondary'
                      }`}
                    >
                      General (no project)
                    </button>
                    {projects.length > 0 && (
                      <div className="border-t border-arc-border my-1" />
                    )}
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setFilterProjectId(project.id);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                          filterProjectId === project.id
                            ? 'bg-arc-accent/10 text-arc-accent'
                            : 'text-arc-text-primary hover:bg-arc-bg-secondary'
                        }`}
                      >
                        <FolderIcon />
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Chat List */}
        <main className="max-w-4xl mx-auto px-4 py-4 w-full">
          {isLoadingList ? (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-arc-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-arc-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-arc-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-arc-text-dim">
                {searchQuery ? 'No chats match your search' : filterProjectId !== undefined ? 'No chats in this filter' : 'No chats yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Select all header */}
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-arc-text-dim">
                <button
                  onClick={selectAll}
                  className="hover:text-arc-text-secondary transition-colors"
                >
                  {selectedChats.size === filteredChats.length ? 'Deselect all' : 'Select all'}
                </button>
                {(searchQuery || filterProjectId !== undefined) && (
                  <span>• {filteredChats.length} result{filteredChats.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Chat items */}
              {filteredChats.map((chat) => {
                const isSelected = selectedChats.has(chat.sessionId);
                const projectName = getProjectName(chat.projectId);

                return (
                  <div
                    key={chat.sessionId}
                    className={`relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-arc-accent/10 border border-arc-accent/30'
                        : 'hover:bg-arc-bg-tertiary border border-transparent'
                    }`}
                    onClick={() => handleChatClick(chat.sessionId)}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(chat.sessionId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 rounded border-arc-border bg-arc-bg-tertiary checked:bg-arc-accent checked:border-arc-accent focus:ring-arc-accent focus:ring-offset-0"
                    />

                    {/* Chat info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-sm font-medium text-arc-text-primary truncate">
                            {chat.title}
                          </h3>
                          {/* Project badge */}
                          {projectName && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-arc-bg-tertiary text-arc-text-secondary rounded flex-shrink-0">
                              <FolderIcon />
                              <span className="truncate max-w-20">{projectName}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-arc-text-dim whitespace-nowrap">
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>
                      {chat.previewText && (
                        <p className="text-xs text-arc-text-secondary mt-0.5 line-clamp-2">
                          {chat.previewText}
                        </p>
                      )}
                    </div>

                    {/* Actions menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenFor(menuOpenFor === chat.sessionId ? null : chat.sessionId);
                          setMoveToProjectFor(null);
                        }}
                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-arc-bg-secondary text-arc-text-dim hover:text-arc-text-primary transition-all"
                      >
                        <MoreIcon />
                      </button>

                      {menuOpenFor === chat.sessionId && (
                        <div className="absolute right-0 top-full mt-1 bg-arc-bg-tertiary border border-arc-border rounded-lg shadow-lg z-20 py-1 min-w-40">
                          <button
                            onClick={(e) => handleBookmark(e, chat.sessionId)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-arc-text-primary hover:bg-arc-bg-secondary transition-colors"
                          >
                            <BookmarkIcon filled={chat.isBookmarked} />
                            {chat.isBookmarked ? 'Unbookmark' : 'Bookmark'}
                          </button>

                          {/* Move to Project submenu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMoveToProjectFor(moveToProjectFor === chat.sessionId ? null : chat.sessionId);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-arc-text-primary hover:bg-arc-bg-secondary transition-colors"
                            >
                              <MoveIcon />
                              Move to Project
                            </button>

                            {moveToProjectFor === chat.sessionId && (
                              <div className="absolute left-full top-0 ml-1 bg-arc-bg-tertiary border border-arc-border rounded-lg shadow-lg z-30 py-1 min-w-36">
                                {/* Remove from project option */}
                                {chat.projectId && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToProject(chat.sessionId, null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-arc-text-primary hover:bg-arc-bg-secondary transition-colors"
                                  >
                                    Remove from project
                                  </button>
                                )}

                                {/* Project options */}
                                {projects.filter(p => p.id !== chat.projectId).map(project => (
                                  <button
                                    key={project.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToProject(chat.sessionId, project.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-arc-text-primary hover:bg-arc-bg-secondary transition-colors"
                                  >
                                    <FolderIcon />
                                    <span className="truncate">{project.name}</span>
                                  </button>
                                ))}

                                {projects.length === 0 && !chat.projectId && (
                                  <div className="px-3 py-2 text-sm text-arc-text-dim italic">
                                    No projects yet
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDeleteChat(e, chat.sessionId)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-arc-bg-secondary transition-colors"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}
