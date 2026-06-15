"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  Menu,
  PenLine,
  PlusCircle,
  Settings,
  Table2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Progress",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/scores", label: "Scores", icon: Table2 },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/log", label: "Log Test", icon: PlusCircle },
      { href: "/ecoute", label: "Compréhension orale", icon: Headphones },
      { href: "/expression-ecrite", label: "Expression écrite", icon: PenLine },
      { href: "/vocabulaire", label: "Vocabulaire", icon: BookOpen },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

function NavContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-4 p-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } =
    useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-200 md:sticky md:top-0 md:z-auto md:h-screen",
          collapsed ? "w-16" : "w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b px-3",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              <ClipboardList className="h-5 w-5 text-primary" />
              <span>TCF Tracker</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div onClick={() => setMobileOpen(false)}>
          <NavContent collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setMobileOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
