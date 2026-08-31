"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  Terminal,
  BarChart3,
  Cpu,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCases } from "@/hooks/use-cases";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: cases } = useCases();

  const activeCasesCount =
    cases?.filter(
      (c) =>
        c.status === "AT_RISK" ||
        c.status === "ANALYZING" ||
        c.status === "WAITING" ||
        c.status === "ACTION_PENDING"
    ).length || 0;

  const navGroups = [
    {
      group: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: "Recovery Cases",
          href: "/cases",
          icon: ShieldAlert,
          badge: activeCasesCount > 0 ? activeCasesCount : null,
          badgeColor: "bg-[#8B7CFF]/20 text-[#8B7CFF] border border-[#8B7CFF]/30",
        },
      ],
    },
    {
      group: "OPERATIONS",
      items: [
        {
          name: "Live Activity",
          href: "/activity",
          icon: Activity,
          badge: "Live",
          badgeColor: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
        },
        {
          name: "Recovery Simulator",
          href: "/simulator",
          icon: Terminal,
          badge: "Demo",
          badgeColor: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
        },
      ],
    },
    {
      group: "INTELLIGENCE",
      items: [
        {
          name: "Evaluation & ROI",
          href: "/evaluation",
          icon: BarChart3,
          badge: "+54.6pp",
          badgeColor: "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/25",
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0D1017] border-r border-[#23262D] transition-all duration-200 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Brand & Identity */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#23262D]">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B7CFF] to-[#6366F1] text-white font-bold shadow-md shadow-[#8B7CFF]/20 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[#F5F7FA] tracking-tight truncate flex items-center gap-1.5">
                RevRecover <span className="text-[10px] font-mono font-normal px-1 py-0.5 rounded bg-[#161C2A] text-[#8B7CFF] border border-[#8B7CFF]/30">AI</span>
              </span>
              <span className="text-[11px] text-[#8B929E] truncate">
                Razorpay Ops Console
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {isOpen && (
              <h3 className="px-2 mb-1.5 text-[10px] font-semibold tracking-wider text-[#8B929E] uppercase font-mono">
                {group.group}
              </h3>
            )}
            {group.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive
                      ? "bg-[#161C2A] text-[#F5F7FA] border border-[#23262D] shadow-xs"
                      : "text-[#8B929E] hover:text-[#F5F7FA] hover:bg-[#121722]"
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-[#8B7CFF]"
                        : "text-[#8B929E] group-hover:text-[#F5F7FA]"
                    )}
                  />
                  {isOpen && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-mono rounded font-medium",
                            item.badgeColor
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#8B7CFF]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer System Engine Status */}
      <div className="p-3 border-t border-[#23262D] bg-[#090C12]">
        {isOpen ? (
          <div className="p-2.5 rounded-lg bg-[#121722] border border-[#23262D] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8B929E]">Durable Engine</span>
              <span className="flex items-center gap-1 font-mono text-emerald-400 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Inngest v3
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8B929E]">Reasoning Model</span>
              <span className="font-mono text-[#8B7CFF] text-[10px]">
                Gemini 1.5 Flash
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
