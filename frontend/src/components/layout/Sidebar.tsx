'use client';
import React from 'react';
import Link from 'next/link';
import { Home, Users, Settings, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Analytics', href: '#', icon: BarChart },
    { name: 'Users', href: '#', icon: Users },
    { name: 'Settings', href: '#', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col bg-white dark:bg-gray-800 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b">
        <span className={cn('text-lg font-bold', { 'sr-only': isCollapsed })}>
          Logo
        </span>
      </div>
      <nav className="flex-1 space-y-2 p-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <item.icon className="h-6 w-6" />
            <span className={cn('ml-4', { 'sr-only': isCollapsed })}>
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;