"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  ShieldAlert,
  Terminal,
  BarChart3,
  Search,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/75 backdrop-blur-xs p-4">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-[#0D1017] border border-[#23262D] rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <Command className="w-full bg-transparent">
          <div className="flex items-center px-4 border-b border-[#23262D]">
            <Search className="w-4 h-4 text-[#8B929E] mr-3 shrink-0" />
            <Command.Input
              placeholder="Type a command or search recovery cases..."
              className="w-full py-3.5 bg-transparent text-sm text-[#F5F7FA] placeholder-[#8B929E] focus:outline-hidden"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-[#8B929E] bg-[#161C2A] border border-[#23262D] rounded">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-sm">
            <Command.Empty className="py-6 text-center text-xs text-[#8B929E]">
              No matching commands or cases found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-[11px] font-semibold text-[#8B929E] px-2 py-1.5 uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#8B7CFF]" />
                <span className="flex-1 font-medium">Executive Dashboard</span>
                <span className="text-xs text-[#8B929E]">Overview</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/cases"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
                <span className="flex-1 font-medium">Recovery Cases</span>
                <span className="text-xs text-[#8B929E]">Operations</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/activity"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <Activity className="w-4 h-4 text-[#38BDF8]" />
                <span className="flex-1 font-medium">Live Event Stream</span>
                <span className="text-xs text-[#8B929E]">Real-time Feed</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/simulator"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <Terminal className="w-4 h-4 text-[#22C55E]" />
                <span className="flex-1 font-medium">Recovery Simulator & Judge Demo</span>
                <span className="text-xs text-[#8B929E]">Simulator</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => router.push("/evaluation"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-[#F97316]" />
                <span className="flex-1 font-medium">AI vs Baseline Benchmark</span>
                <span className="text-xs text-[#8B929E]">Evaluation</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Fast Demo Actions" className="text-[11px] font-semibold text-[#8B929E] px-2 py-1.5 uppercase tracking-wider mt-2">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/simulator?run=demo"))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <Zap className="w-4 h-4 text-[#8B7CFF]" />
                <span className="flex-1">Run 4-Scenario Full Demo</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B929E]" />
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/simulator?scenario=bank_decline"))}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#161C2A] cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#22C55E]" />
                <span className="flex-1">Simulate Bank Decline (Auto-Retry)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B929E]" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 border-t border-[#23262D] bg-[#090C12] text-[11px] text-[#8B929E]">
            <span>Navigate with ↑ ↓ and Enter</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CFF]" />
              AI Revenue Recovery Engine
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
