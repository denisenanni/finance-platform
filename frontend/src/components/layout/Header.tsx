'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:bg-gray-800">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <div>
        {/* Placeholder for user menu or other header items */}
        <p>Header</p>
      </div>
    </header>
  );
};

export default Header;