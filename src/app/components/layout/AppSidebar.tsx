import React from 'react';

interface Collection {
  id: string;
  name: string;
  isActive?: boolean;
}

interface AppSidebarProps {
  collections?: Collection[];
  activeCollectionId?: string;
  onCollectionSelect?: (collectionId: string) => void;
  userEmail?: string;
}

export function AppSidebar({
  collections = [{ id: '1', name: 'My First Collection', isActive: true }],
  activeCollectionId = '1',
  onCollectionSelect,
  userEmail = 'user@example.com',
}: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col p-4">
      {/* Collections Section */}
      <div className="flex-1">
        <h2 className="mb-3 text-sm font-medium tracking-wide text-[#a6a6a6] uppercase">
          Test Collections
        </h2>

        <div className="space-y-1">
          {collections.map(collection => (
            <div
              key={collection.id}
              className={`flex cursor-pointer items-center rounded px-3 py-2 transition-colors ${
                collection.id === activeCollectionId
                  ? 'bg-[#3b3b3b] text-white'
                  : 'text-[#a6a6a6] hover:bg-[#2e2e2e] hover:text-white'
              } `}
              onClick={() => onCollectionSelect?.(collection.id)}
            >
              {/* Collection icon */}
              <div className="mr-3 h-4 w-4 flex-shrink-0">
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path d="M3 2.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-11zm1 0v11h8v-11H4z" />
                  <path d="M1.5 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
                </svg>
              </div>

              {/* Collection name */}
              <span className="truncate text-sm font-medium">{collection.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account Section - Bottom */}
      <div className="mt-4 border-t border-[#333] pt-4">
        <div className="flex cursor-pointer items-center rounded px-3 py-2 transition-colors hover:bg-[#2e2e2e]">
          {/* Avatar placeholder */}
          <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4a4a4a]">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-[#a6a6a6]">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
            </svg>
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">Account</div>
            <div className="truncate text-xs text-[#a6a6a6]">{userEmail}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
