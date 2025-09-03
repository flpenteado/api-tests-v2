import React from 'react';

interface AppLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar: React.ReactNode;
}

export function AppLayout({ header, sidebar, mainContent, rightSidebar }: AppLayoutProps) {
  return (
    <div className="main-grid bg-[#1a1a1a] text-white min-h-screen">
      {/* Header - spans full width */}
      <header className="grid-header border-b border-[#333] pb-4">
        {header}
      </header>

      {/* Left sidebar */}
      <aside className="grid-sidebar bg-[#252526] overflow-y-auto">
        {sidebar}
      </aside>

      {/* Main content area */}
      <main className="grid-main bg-[#1e1e1e] overflow-y-auto">
        {mainContent}
      </main>

      {/* Right sidebar */}
      <aside className="grid-right-sidebar bg-[#252526] overflow-y-auto">
        {rightSidebar}
      </aside>

      <style jsx>{`
        .main-grid {
          display: grid;
          grid-template-columns: 250px 1fr 350px;
          grid-template-rows: auto 1fr;
          grid-template-areas:
            'header header header'
            'sidebar main right-sidebar';
          height: 100vh;
          gap: 1rem;
          padding: 1rem;
        }

        .grid-header {
          grid-area: header;
        }

        .grid-sidebar {
          grid-area: sidebar;
        }

        .grid-main {
          grid-area: main;
        }

        .grid-right-sidebar {
          grid-area: right-sidebar;
        }

        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 250px 1fr;
            grid-template-areas:
              'header header'
              'sidebar main';
          }

          .grid-right-sidebar {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              'header'
              'main';
          }

          .grid-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
