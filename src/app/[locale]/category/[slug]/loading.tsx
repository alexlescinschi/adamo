export default function CategoryLoading() {
  return (
    <div className="py-6">
      <div className="mb-4 h-5 w-40 animate-pulse rounded-[6px] bg-[#e4e8e4]" />

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 gap-[14px] md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[9px] border border-[#e4e8e4] bg-white p-[14px]">
            <div className="aspect-[4/3] rounded-[7px] bg-[#f3f6f6] mb-[10px] animate-pulse" />
            <div className="h-4 w-3/4 rounded-[5px] bg-[#e4e8e4] animate-pulse mb-2" />
            <div className="h-3 w-1/2 rounded-[5px] bg-[#edf7e8] animate-pulse mb-3" />
            <div className="flex items-end justify-between">
              <div>
                <div className="h-6 w-20 rounded-[5px] bg-[#e4e8e4] animate-pulse mb-1" />
                <div className="h-3 w-16 rounded-[5px] bg-[#e4e8e4] animate-pulse" />
              </div>
              <div className="h-9 w-24 rounded-[7px] bg-gradient-to-r from-[#7cc44e]/40 to-[#63ad36]/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
