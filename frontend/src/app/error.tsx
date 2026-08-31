"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="py-20 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
      <h2 className="text-xl font-bold text-[#F5F7FA]">
        Failed to load operations dashboard
      </h2>
      <p className="text-xs text-[#8B929E] max-w-md mx-auto">
        {error.message || "An unexpected error occurred while fetching recovery data."}
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B7CFF] text-xs font-semibold text-white hover:bg-[#7966FF] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#161C2A] text-xs text-[#F5F7FA] hover:bg-[#23262D] border border-[#23262D] transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
}
