/**
 * ChatInputArea - Claude.ai-style chat input with contextual icons
 *
 * Features:
 * - [+] Attachment button with dropdown menu
 * - [≡] Tools menu with style selection and feature toggles
 * - Quick toggle buttons for frequently used features
 * - Attachment preview area above input
 * - Model selector dropdown (future)
 * - Works in both centered (empty) and footer (conversation) modes
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { api, type ResponseStyleId, type ResponseStyleOption } from '../api/client';

// ============================================================================
// Types
// ============================================================================

interface Attachment {
  id: string;
  file: File;
  preview?: string; // For images
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface ChatInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'centered' | 'footer';
  autoFocus?: boolean;
  // Feature toggles
  showAttachments?: boolean;
  showToolsMenu?: boolean;
  showModelSelector?: boolean;
  // Quick suggestions shown as chips inside input footer
  suggestions?: string[];
}

// ============================================================================
// Icon Components (inline SVGs for simplicity)
// ============================================================================

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SlidersIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronIcon = ({ direction = 'right' }: { direction?: 'left' | 'right' | 'down' }) => {
  const rotation = direction === 'left' ? 180 : direction === 'down' ? 90 : 0;
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: `rotate(${rotation}deg)` }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-arc-border">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-2 bg-arc-bg-secondary border border-arc-border-subtle rounded-lg px-3 py-2 text-sm group"
        >
          <FileIcon />
          <span className="text-arc-text-primary max-w-[150px] truncate">
            {attachment.file.name}
          </span>
          <span className="text-arc-text-dim text-xs">
            {formatFileSize(attachment.file.size)}
          </span>
          {attachment.status === 'uploading' && (
            <span className="text-arc-accent text-xs animate-pulse">Uploading...</span>
          )}
          {attachment.status === 'error' && (
            <span className="text-red-400 text-xs">{attachment.error}</span>
          )}
          <button
            onClick={() => onRemove(attachment.id)}
            className="text-arc-text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: () => void;
  onUseProject?: () => void;
}

function AttachmentMenu({ isOpen, onClose, onFileSelect, onUseProject }: AttachmentMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={onClose} />
      {/* Menu */}
      <div className="absolute bottom-full left-0 mb-2 w-56 bg-arc-bg-secondary border border-arc-border rounded-lg shadow-xl z-20">
        <div className="p-1">
          <button
            onClick={() => { onFileSelect(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-arc-text-primary hover:bg-arc-bg-tertiary rounded-md transition-colors"
          >
            <FileIcon />
            Upload file
          </button>
          {onUseProject && (
            <button
              onClick={() => { onUseProject(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-arc-text-secondary hover:bg-arc-bg-tertiary rounded-md transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Use project files
            </button>
          )}
        </div>
      </div>
    </>
  );
}

interface ToolsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: ResponseStyleId;
  styles: ResponseStyleOption[];
  onStyleChange: (style: ResponseStyleId) => void;
  memoryEnabled?: boolean;
  onToggleMemory?: () => void;
  xeroConnected?: boolean;
}

function ToolsMenu({
  isOpen,
  onClose,
  currentStyle,
  styles,
  onStyleChange,
  memoryEnabled = true,
  onToggleMemory,
  xeroConnected = false,
}: ToolsMenuProps) {
  const [showStyleSubmenu, setShowStyleSubmenu] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={onClose} />
      {/* Menu */}
      <div className="absolute bottom-full left-8 mb-2 w-52 bg-arc-bg-secondary border border-arc-border rounded-lg shadow-xl z-20">
        <div className="py-1">
          {/* Style selector */}
          <div className="relative">
            <button
              onClick={() => setShowStyleSubmenu(!showStyleSubmenu)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-arc-text-primary hover:bg-arc-bg-tertiary transition-colors"
            >
              <span>Use style</span>
              <div className="flex items-center gap-1.5 text-arc-text-secondary">
                <span className="text-xs">{styles.find(s => s.id === currentStyle)?.name || 'Normal'}</span>
                <ChevronIcon direction="right" />
              </div>
            </button>

            {/* Style submenu - single line items with tooltips */}
            {showStyleSubmenu && (
              <div className="absolute left-full top-0 ml-1 w-36 bg-arc-bg-secondary border border-arc-border rounded-lg shadow-xl">
                <div className="py-1">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        onStyleChange(style.id);
                        setShowStyleSubmenu(false);
                        onClose();
                      }}
                      title={style.description}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-arc-text-primary hover:bg-arc-bg-tertiary transition-colors"
                    >
                      <span>{style.name}</span>
                      {currentStyle === style.id && <CheckIcon />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-arc-border my-1" />

          {/* Memory toggle */}
          {onToggleMemory && (
            <button
              onClick={() => { onToggleMemory(); onClose(); }}
              title="Toggle memory for personalized responses"
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-arc-text-primary hover:bg-arc-bg-tertiary transition-colors"
            >
              <span>Memory</span>
              <div className={`w-8 h-4 rounded-full transition-colors ${memoryEnabled ? 'bg-arc-accent' : 'bg-arc-bg-tertiary border border-arc-border'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5 ${memoryEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-arc-border my-1" />

          {/* Xero connector - single line */}
          <div
            className="flex items-center justify-between px-3 py-1.5 text-sm"
            title="Xero accounting integration"
          >
            <div className="flex items-center gap-2 text-arc-text-primary">
              <span className="w-2 h-2 rounded-full bg-[#13B5EA]" />
              <span>Xero</span>
            </div>
            <span className={`text-xs ${xeroConnected ? 'text-arc-accent' : 'text-arc-text-dim'}`}>
              {xeroConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-arc-border my-1" />

          {/* Settings link */}
          <a
            href="/settings"
            className="w-full flex items-center px-3 py-1.5 text-sm text-arc-text-secondary hover:bg-arc-bg-tertiary transition-colors"
          >
            Settings
          </a>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatInputArea({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask about your finances...',
  disabled = false,
  isLoading = false,
  variant = 'footer',
  autoFocus = false,
  showAttachments = true,
  showToolsMenu = true,
  showModelSelector = false,
  suggestions = [],
}: ChatInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [styles, setStyles] = useState<ResponseStyleOption[]>([]);
  const [currentStyle, setCurrentStyle] = useState<ResponseStyleId>('normal');
  const [xeroConnected, setXeroConnected] = useState(false);

  // Load styles and settings on mount
  useEffect(() => {
    api.getStyles().then(({ styles }) => setStyles(styles)).catch(console.error);
    api.getSettings().then(({ settings }) => setCurrentStyle(settings.responseStyle)).catch(console.error);
    api.getAuthStatus().then((status) => setXeroConnected(status.connected)).catch(console.error);
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: Attachment[] = files.map(file => ({
      id: generateId(),
      file,
      status: 'pending',
    }));
    setAttachments(prev => [...prev, ...newAttachments]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Remove attachment
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Handle style change
  const handleStyleChange = useCallback(async (styleId: ResponseStyleId) => {
    try {
      await api.updateSettings({ responseStyle: styleId });
      setCurrentStyle(styleId);
    } catch (err) {
      console.error('Failed to update style:', err);
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;

    const files = attachments.map(a => a.file);
    onSubmit(value.trim(), files.length > 0 ? files : undefined);
    setAttachments([]);
  }, [value, isLoading, disabled, attachments, onSubmit]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const canSubmit = value.trim() && !isLoading && !disabled;

  return (
    <div className={`w-full ${variant === 'centered' ? '' : ''}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx,.csv,.xlsx"
        multiple
        className="hidden"
      />

      {/* Main container */}
      <div className="bg-arc-bg-tertiary border border-arc-border rounded-xl focus-within:border-arc-accent transition-colors">
        {/* Attachment preview */}
        <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />

        {/* Input row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-2 py-2">
          {/* Left icons */}
          <div className="flex items-center gap-1 relative">
            {/* Attachment button */}
            {showAttachments && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                  className="p-2 text-arc-text-secondary hover:text-arc-text-primary hover:bg-arc-bg-secondary rounded-lg transition-colors"
                  title="Attach files"
                >
                  <PlusIcon />
                </button>
                <AttachmentMenu
                  isOpen={attachmentMenuOpen}
                  onClose={() => setAttachmentMenuOpen(false)}
                  onFileSelect={() => fileInputRef.current?.click()}
                />
              </div>
            )}

            {/* Tools menu button */}
            {showToolsMenu && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  className="p-2 text-arc-text-secondary hover:text-arc-text-primary hover:bg-arc-bg-secondary rounded-lg transition-colors"
                  title="Tools and settings"
                >
                  <SlidersIcon />
                </button>
                <ToolsMenu
                  isOpen={toolsMenuOpen}
                  onClose={() => setToolsMenuOpen(false)}
                  currentStyle={currentStyle}
                  styles={styles}
                  onStyleChange={handleStyleChange}
                  xeroConnected={xeroConnected}
                />
              </div>
            )}
          </div>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="flex-1 bg-transparent focus:outline-none text-sm text-arc-text-primary placeholder-arc-text-dim min-w-0"
          />

          {/* Right side: Model selector (future) + Send */}
          <div className="flex items-center gap-2">
            {/* Model selector placeholder */}
            {showModelSelector && (
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 text-xs text-arc-text-secondary hover:text-arc-text-primary hover:bg-arc-bg-secondary rounded-lg transition-colors"
              >
                <span>Claude</span>
                <ChevronIcon direction="down" />
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="p-2 bg-arc-accent text-arc-bg-primary rounded-lg hover:bg-arc-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </form>

        {/* Suggestions footer - inside container */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2 pt-1 border-t border-arc-border-subtle">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(suggestion)}
                className="px-2.5 py-1 text-xs text-arc-text-secondary bg-arc-bg-secondary border border-arc-border rounded-full hover:border-arc-accent hover:text-arc-accent transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export type { Attachment, ChatInputAreaProps };
