export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 py-8 px-4">
      <div className="h-8 bg-primary/10 rounded-brand-sm w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-primary/5 rounded-brand" />
        ))}
      </div>
      <div className="h-48 bg-primary/5 rounded-brand" />
    </div>
  );
}
