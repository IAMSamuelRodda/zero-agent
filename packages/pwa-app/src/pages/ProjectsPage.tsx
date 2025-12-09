/**
 * Projects Page - Grid of project cards
 * Claude.ai pattern: Projects are containers, clicking opens project detail
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
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

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const ChatsIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects,
    isLoading,
    loadProjects,
    createProject,
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  // Handle project card click - navigate to project detail
  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // Handle create project
  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const newProject = await createProject({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewName('');
      setNewDescription('');
      setIsCreating(false);
      // Navigate to the new project
      if (newProject?.id) {
        navigate(`/projects/${newProject.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-arc-border">
          <button
            onClick={() => navigate('/')}
            className="p-1 text-arc-text-secondary hover:text-arc-text-primary transition-colors"
          >
            <ChevronLeftIcon />
          </button>
          <h1 className="text-lg font-medium text-arc-text-primary">Projects</h1>
          <span className="text-sm text-arc-text-dim">({projects.length})</span>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-arc-border">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-arc-text-dim">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-arc-bg-secondary border border-arc-border rounded-lg text-sm text-arc-text-primary placeholder-arc-text-dim focus:border-arc-accent focus:outline-none"
            />
          </div>

          {/* New Project Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 bg-arc-accent text-arc-bg-primary text-sm rounded-lg hover:bg-arc-accent-dim transition-colors"
          >
            <PlusIcon />
            <span>New</span>
          </button>
        </div>

        {/* Create Project Form */}
        {isCreating && (
          <div className="px-6 py-4 border-b border-arc-border bg-arc-bg-secondary">
            <div className="space-y-3 max-w-md">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                autoFocus
                className="w-full px-3 py-2 bg-arc-bg-tertiary border border-arc-border rounded-lg text-sm text-arc-text-primary placeholder-arc-text-dim focus:border-arc-accent focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }
                }}
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 bg-arc-bg-tertiary border border-arc-border rounded-lg text-sm text-arc-text-primary placeholder-arc-text-dim focus:border-arc-accent focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-3 py-1.5 bg-arc-accent text-arc-bg-primary text-sm rounded-lg hover:bg-arc-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                    setNewDescription('');
                  }}
                  className="px-3 py-1.5 text-arc-text-secondary text-sm rounded-lg hover:bg-arc-bg-tertiary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-arc-text-dim">
              Loading...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-arc-text-dim">
              {searchQuery ? (
                <p>No projects match "{searchQuery}"</p>
              ) : (
                <>
                  <FolderIcon />
                  <p className="mt-2">No projects yet</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="mt-2 text-arc-accent hover:underline"
                  >
                    Create your first project
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="text-left p-4 bg-arc-bg-secondary rounded-xl border border-arc-border hover:border-arc-accent/50 hover:bg-arc-bg-tertiary transition-all group"
                >
                  {/* Project Icon */}
                  <div className="w-10 h-10 rounded-lg bg-arc-bg-tertiary flex items-center justify-center mb-3 text-arc-text-dim group-hover:text-arc-accent transition-colors">
                    <FolderIcon />
                  </div>

                  {/* Project Name */}
                  <h3 className="font-medium text-arc-text-primary mb-1 truncate">
                    {project.name}
                  </h3>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-arc-text-secondary line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  {/* Footer: chat count and date */}
                  <div className="flex items-center justify-between text-xs text-arc-text-dim mt-auto pt-2 border-t border-arc-border-subtle">
                    <div className="flex items-center gap-1">
                      <ChatsIcon />
                      <span>{project.chatCount || 0} chats</span>
                    </div>
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
