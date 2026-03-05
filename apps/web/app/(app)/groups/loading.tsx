export default function GroupsLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-soft-gray rounded mb-2" />
          <div className="h-5 w-72 bg-soft-gray rounded" />
        </div>
        <div className="h-10 w-28 bg-soft-gray rounded-button" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 bg-soft-gray rounded-card" />
        ))}
      </div>
    </div>
  );
}
