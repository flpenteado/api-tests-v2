import React from 'react';

interface AppLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar: React.ReactNode;
}

export function AppLayout({ header, sidebar, mainContent, rightSidebar }: AppLayoutProps) {
  const hasRight = Boolean(rightSidebar);
  return (
    <div className="main-grid min-h-screen bg-[#1a1a1a] text-white">
      {/* Header - spans full width */}
      <header className="grid-header border-b border-[#333] pb-4">{header}</header>

      {/* Left sidebar */}
      <aside className="grid-sidebar overflow-y-auto bg-[#252526]">{sidebar}</aside>

      {/* Main content area */}
      <main className="grid-main overflow-y-auto bg-[#1e1e1e]">{mainContent}</main>

      {/* Right sidebar */}
      {hasRight && (
        <aside className="grid-right-sidebar overflow-y-auto bg-[#252526]">{rightSidebar}</aside>
      )}

      <style jsx>{`
        .main-grid {
          display: grid;
          grid-template-columns: 250px 1fr ${hasRight ? '350px' : ''};
          grid-template-rows: auto 1fr;
          grid-template-areas: ${hasRight
            ? `'header header header'\n            'sidebar main right-sidebar'`
            : `'header header'\n            'sidebar main'`};
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
          ${hasRight ? `.grid-right-sidebar { display: none; }` : ''}
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
