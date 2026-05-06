"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Search, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  User, 
  Settings,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  role: 'student' | 'professor' | 'admin';
}

export function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const navItems = {
    student: [
      { name: "Dashboard", href: "/dashboard", icon: BookOpen },
      { name: "Browse Professors", href: "/professors", icon: Search },
      { name: "Messages", href: "/messages", icon: MessageSquare },
    ],
    professor: [
      { name: "Professor Portal", href: "/prof/dashboard", icon: LayoutDashboard },
      { name: "All Messages", href: "/messages", icon: MessageSquare },
      { name: "My Profile", href: "/prof/profile", icon: User },
      { name: "Settings", href: "/prof/settings", icon: Settings },
    ],
    admin: [
      { name: "Approval Portal", href: "/admin/dashboard", icon: ShieldCheck },
      { name: "User Directory", href: "#", icon: Search },
    ]
  };

  const currentNav = navItems[role];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-5 right-6 z-[60] p-3 rounded-xl bg-[rgba(17,34,64,0.8)] border border-[rgba(212,146,42,0.2)] text-[var(--amber)] backdrop-blur-md shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[55] w-[280px] bg-[rgba(11,22,40,0.98)] border-r border-[rgba(155,175,192,0.1)] flex flex-col transition-transform duration-500 ease-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-10">
          <Link href="/" className="font-serif text-2xl text-[var(--ivory)] hover:opacity-80 transition-opacity flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-[var(--amber)] rounded-lg font-serif text-[var(--navy)] text-xl font-bold">S</div>
            <div>Schol<span className="text-[var(--amber)]">lective</span></div>
          </Link>
        </div>

        <nav className="flex-grow px-6 space-y-1.5">
          {currentNav.map((item) => (
            <Link 
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                pathname === item.href 
                  ? "bg-[rgba(212,146,42,0.08)] text-[var(--ivory)] border border-[rgba(212,146,42,0.2)]" 
                  : "text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--ivory)]"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-colors",
                pathname === item.href ? "text-[var(--amber)]" : "group-hover:text-[var(--amber-light)]"
              )} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-[rgba(155,175,192,0.05)]">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
