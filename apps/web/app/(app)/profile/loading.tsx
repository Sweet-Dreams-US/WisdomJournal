export default function ProfileLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-8 w-48 bg-soft-gray rounded mb-2" />
      <div className="h-5 w-72 bg-soft-gray rounded mb-6" />
      <div className="h-32 bg-soft-gray rounded-card mb-6" />
      <div className="h-6 w-40 bg-soft-gray rounded mb-3" />
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-soft-gray rounded-card" />
        ))}
      </div>
      <div className="h-48 bg-soft-gray rounded-card mb-6" />
      <div className="h-6 w-36 bg-soft-gray rounded mb-3" />
      <div className="h-40 bg-soft-gray rounded-card" />
    </div>
  );
}
