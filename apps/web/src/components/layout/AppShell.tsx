'use client';

import { useState, type ReactNode } from 'react';
import { DesktopSidebar, MobileSidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  topbarActions?: ReactNode;
}

export function AppShell({ children, title, topbarActions }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DesktopSidebar />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          actions={topbarActions}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
