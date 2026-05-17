export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function SkeletonList({ count = 3, height = 'h-20' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className={`card ${height}`} />
      ))}
    </div>
  );
}
