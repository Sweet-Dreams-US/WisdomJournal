export default function AskLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-8 w-48 bg-soft-gray rounded mb-2" />
      <div className="h-5 w-72 bg-soft-gray rounded mb-6" />
      <div className="h-14 bg-soft-gray rounded-card mb-3" />
      <div className="h-10 bg-soft-gray rounded mb-6 w-64" />
      <div className="h-5 w-32 bg-soft-gray rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-soft-gray rounded-card" />
        ))}
      </div>
    </div>
  );
}
