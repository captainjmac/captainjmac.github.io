import * as React from 'react';
import {cn} from '@/lib/utils';

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export function Sidebar({children, className}: SidebarProps) {
  return (
    <aside className={cn('h-full bg-gray-800 flex flex-col border-r border-gray-700 overflow-y-auto', className)}>
      {children}
    </aside>
  );
}
