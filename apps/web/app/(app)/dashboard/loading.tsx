export default function DashboardLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="h-8 w-72 bg-soft-gray rounded mb-2" />
      <div className="h-5 w-56 bg-soft-gray rounded mb-8" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-soft-gray rounded-card" />
        ))}
      </div>
      <div className="h-6 w-48 bg-soft-gray rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-soft-gray rounded-card" />
        ))}
      </div>
    </div>
  );
}
