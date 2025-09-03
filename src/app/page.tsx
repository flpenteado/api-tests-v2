'use client';

import AppPage from './AppPage';

export default function Home() {
  return (
    <div className="bg-app min-h-screen">
      {/* Top bar */}
      <header className="topbar">
        <h1 className="text-lg font-semibold">API Tests v2</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="badge">v0.0.1</span>
          <button className="btn-base btn-ghost btn-sm">Settings</button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <aside className="sidebar z-10 h-full w-64 flex-shrink-0 border-r border-gray-300 bg-gray-100 shadow-lg">
          <div className="p-4">
            <h2 className="text-secondary mb-3 text-sm font-medium">Test Collections</h2>
            <div className="space-y-1">
              <div className="sidebar-item active">
                <span className="text-sm">My First Collection</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="h-full flex-1">
          <AppPage />
        </main>
      </div>
    </div>
  );
}
