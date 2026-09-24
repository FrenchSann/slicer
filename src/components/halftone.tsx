export default function Halftone() {
  return (
    <svg className="dot-pattern" viewBox="0 0 250 270" aria-hidden="true">
      {Array.from({ length: 30 }, (_, y) =>
        Array.from({ length: 28 }, (_, x) => {
          const progress = Math.max(0, Math.min(1, (x + y - 14) / 32));
          return (
            <circle
              key={`${x}-${y}`}
              cx={x * 9}
              cy={y * 9}
              r={progress * 2.6}
              fill="#e51b2b"
            />
          );
        }),
      )}
    </svg>
  );
}
