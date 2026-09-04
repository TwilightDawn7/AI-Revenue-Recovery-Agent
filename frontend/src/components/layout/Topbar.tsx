"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Zap,
  Menu,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useHealth } from "@/hooks/use-health";
import { useQueryClient } from "@tanstack/react-query";

interface TopbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { data: health, isError, isLoading } = useHealth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isConnected = !isError && !isLoading && health?.status === "healthy";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-[#08090D]/85 backdrop-blur-md border-b border-[#23262D]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-[#8B929E] hover:text-[#F5F7FA] hover:bg-[#161C2A] transition-colors focus:outline-hidden cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (opens cmdk) */}
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D1017] border border-[#23262D] text-xs text-[#8B929E] hover:border-[#353B47] hover:text-[#F5F7FA] transition-colors min-w-[220px] cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search or jump to...</span>
          <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#161C2A] border border-[#23262D] text-[#8B929E]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Backend Health Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
              : "bg-red-500/10 text-red-400 border-red-500/25"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
            }`}
          />
          <span className="hidden md:inline">
            {isConnected ? "FastAPI Core Connected" : "Backend Offline"}
          </span>
          <span className="md:hidden">
            {isConnected ? "API Online" : "API Offline"}
          </span>
        </div>

        {/* Razorpay Mode Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#121722] text-[#8B929E] border border-[#23262D]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Razorpay Test Mode</span>
        </div>

        {/* Refresh All Queries Button */}
        <button
          onClick={handleManualRefresh}
          className="p-1.5 rounded-md text-[#8B929E] hover:text-[#F5F7FA] hover:bg-[#161C2A] border border-transparent hover:border-[#23262D] transition-all cursor-pointer"
          title="Refresh real-time data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#8B7CFF]" : ""}`}
          />
        </button>

        {/* Fast Action Demo Button */}
        <Link
          href="/simulator?run=demo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#8B7CFF] hover:bg-[#7966FF] text-white shadow-sm shadow-[#8B7CFF]/30 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="font-semibold">Run Live Demo</span>
        </Link>
      </div>
    </header>
  );
}
