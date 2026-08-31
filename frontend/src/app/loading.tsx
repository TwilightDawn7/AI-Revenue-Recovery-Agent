export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[#161C2A] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#0D1017] rounded-xl" />
        ))}
      </div>
      <div className="h-44 w-full bg-[#0D1017] rounded-xl" />
    </div>
  );
}
