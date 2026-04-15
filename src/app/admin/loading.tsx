export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 py-8 px-4">
      <div className="h-8 bg-primary/10 rounded-brand-sm w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-primary/5 rounded-brand" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-primary/5 rounded-brand" />
        <div className="h-64 bg-primary/5 rounded-brand" />
      </div>
    </div>
  );
}
