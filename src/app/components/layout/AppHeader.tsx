import React from 'react';

interface AppHeaderProps {
  title?: string;
  version?: string;
  onSettingsClick?: () => void;
}

export function AppHeader({
  title = 'API Tests v2',
  version = 'v0.0.1',
  onSettingsClick,
}: AppHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between">
      {/* Title */}
      <h1 className="text-lg font-bold text-white">{title}</h1>

      {/* Right section with version and settings */}
      <div className="flex items-center gap-3">
        {/* Version badge */}
        <span className="rounded bg-[#333] px-2 py-1 text-sm font-normal text-[#a6a6a6]">
          {version}
        </span>

        {/* Settings button */}
        <button
          className="rounded px-3 py-1 text-sm font-normal text-[#a6a6a6] transition-colors hover:bg-[#333] hover:text-white"
          onClick={onSettingsClick}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
