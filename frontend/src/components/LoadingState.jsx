export default function LoadingState({ message = 'Loading...', type = 'spinner' }) {
  if (type === 'skeleton') {
    return (
      <div className="space-y-4 animate-fade-in">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton w-24 h-6 rounded" />
              <div className="skeleton w-48 h-5 rounded" />
            </div>
            <div className="skeleton w-full h-4 rounded" />
            <div className="skeleton w-3/4 h-4 rounded" />
            <div className="mt-3 space-y-2">
              <div className="skeleton w-full h-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'extraction') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 animate-fade-in">
        {/* Animated graph building visual */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-2 border-verse-red/20" />
          <div className="absolute inset-2 rounded-full border-2 border-verse-red/30 animate-pulse-glow" />
          <div className="absolute inset-4 rounded-full border-2 border-verse-red/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="spinner !w-8 !h-8 !border-[3px]" />
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-verse-red rounded-full" />
          </div>
          <div className="absolute inset-0 animate-[spin_6s_linear_infinite_reverse]">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-verse-red-glow rounded-full" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-verse-text font-semibold text-lg">{message}</p>
          <p className="text-verse-text-muted text-sm">
            Extracting characters, events, and relationships...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
      <div className="spinner" />
      <p className="text-verse-text-muted text-sm">{message}</p>
    </div>
  );
}
