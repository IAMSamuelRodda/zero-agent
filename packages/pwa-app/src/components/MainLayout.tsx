/**
 * MainLayout - Shared layout with sidebar for all main pages
 * Provides consistent navigation across Chat, Chats, Projects, Settings pages
 */

import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-arc-bg-primary font-sans">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
