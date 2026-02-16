'use client';

import { type ReactNode } from 'react';
import {
  IconBuildingSkyscraper,
  IconSearch,
  IconSettings,
  IconUser,
  IconTargetArrow,
} from '@tabler/icons-react';

type NavItem = {
  label: string;
  icon: ReactNode;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Search', icon: <IconSearch size={16} /> },
  {
    label: 'Companies',
    icon: <IconBuildingSkyscraper size={16} />,
    active: true,
  },
  { label: 'People', icon: <IconUser size={16} /> },
  { label: 'Opportunities', icon: <IconTargetArrow size={16} /> },
  { label: 'Settings', icon: <IconSettings size={16} /> },
];

type TwentyDemoShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
  rightPanelOpen?: boolean;
};

export const TwentyDemoShell = ({
  children,
  rightPanel,
  rightPanelOpen = true,
}: TwentyDemoShellProps) => (
  <div className="flex h-screen bg-[#171717] text-[#ebebeb]">
    {/* Sidebar */}
    <div className="flex w-[220px] shrink-0 flex-col border-r border-[#222222] bg-[#171717]">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
          T
        </div>
        <span className="text-sm font-medium text-[#ebebeb]">Twenty CRM</span>
      </div>

      <nav className="mt-2 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm ${
              item.active
                ? 'bg-[#1b1b1b] text-[#ebebeb]'
                : 'text-[#818181] hover:bg-[#1e1e1e] hover:text-[#b3b3b3]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </div>

    {/* Main Content */}
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">{children}</div>
      {rightPanel && (
        <div
          className={`shrink-0 overflow-y-auto border-l border-[#222222] bg-[#171717] transition-all duration-200 ${
            rightPanelOpen
              ? 'w-[380px] opacity-100'
              : 'w-0 overflow-hidden opacity-0 border-l-0'
          }`}
        >
          {rightPanel}
        </div>
      )}
    </div>
  </div>
);
