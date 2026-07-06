interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`spinner spinner-${size}`}
      role="status"
      aria-label="loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
      <p className="page-loader-text">Loading…</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}
