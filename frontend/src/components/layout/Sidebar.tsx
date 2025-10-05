"use client";
import React from "react";
import Link from "next/link";
import { Home, Users, Settings, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Analytics", href: "#", icon: BarChart },
    { name: "Users", href: "#", icon: Users },
    { name: "Settings", href: "#", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div
        className="flex h-16 items-center justify-center"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className={cn("text-lg font-bold", { "sr-only": isCollapsed })}>
          Logo
        </span>
      </div>
      <nav className="flex-1 space-y-2 p-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center rounded-md p-2 transition-colors",
              { "sr-only": isCollapsed }
            )}
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <item.icon className="h-6 w-6" />
            <span className={cn("ml-4", { "sr-only": isCollapsed })}>
              {" "}
              {item.name}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
