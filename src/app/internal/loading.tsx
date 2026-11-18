// Shown instantly while a portal page loads; the sidebar stays in place.
export default function Loading() {
  const bar = 'bg-stone-200/70 rounded-md animate-pulse';
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" aria-busy="true" aria-label="Loading">
      <div className={`${bar} h-7 w-48 mb-2`} />
      <div className={`${bar} h-4 w-72 mb-8`} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-white border border-stone-200/80 rounded-xl" />)}
      </div>
      <div className="bg-white border border-stone-200/80 rounded-xl divide-y divide-stone-100">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <div className={`${bar} h-9 w-9 rounded-lg`} />
            <div className="flex-1 space-y-2"><div className={`${bar} h-3.5 w-1/3`} /><div className={`${bar} h-3 w-1/2`} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
