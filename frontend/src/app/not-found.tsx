import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="py-20 text-center space-y-4">
      <ShieldAlert className="w-12 h-12 text-[#8B929E] mx-auto" />
      <h2 className="text-xl font-bold text-[#F5F7FA]">Page Not Found</h2>
      <p className="text-xs text-[#8B929E] max-w-sm mx-auto">
        The requested console route does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#161C2A] text-xs text-[#F5F7FA] hover:bg-[#23262D] border border-[#23262D] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>
    </div>
  );
}
