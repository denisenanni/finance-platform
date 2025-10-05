"use client";
import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../theme/ThemeToggle";

const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <header
      className="flex h-16 items-center justify-between border-b bg-white px-4"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
