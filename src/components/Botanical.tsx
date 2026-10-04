type MotifProps = { className?: string };

export function CallLily({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 64 96" className={className} fill="none" aria-hidden="true">
      <path
        d="M32 92c0-26 0-44 0-56"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M32 46c-8-2-13-8-14-16-1-7 3-14 9-16 3 6 5 12 5 18z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M32 46c8-2 13-8 14-16 1-7-3-14-9-16-3 6-5 12-5 18z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M32 60c-7-2-11-7-12-13 0-6 3-11 8-13 2 5 4 10 4 15z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M32 60c7-2 11-7 12-13 0-6-3-11-8-13-2 5-4 10-4 15z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="30" r="2.4" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Mosquitinho({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 52c14-2 22-12 28-24"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path d="M34 28c-2-8 2-16 10-18" stroke="currentColor" strokeWidth="1.1" />
      <path d="M40 32c4-7 11-11 19-9" stroke="currentColor" strokeWidth="1.1" />
      <path d="M42 24c2-7 8-12 16-12" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="24" cy="16" r="4" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="44" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="64" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="80" cy="20" r="2.2" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="56" cy="28" r="2.4" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Trigo({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 48 96" className={className} fill="none" aria-hidden="true">
      <path d="M24 92V34" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index}>
          <path
            d={`M24 ${52 - index * 12}c-7 0-12-3-13-8 6-1 11 1 13 5z`}
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path
            d={`M24 ${52 - index * 12}c7 0 12-3 13-8-6-1-11 1-13 5z`}
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
      ))}
      <path d="M24 32c-5-1-8-4-9-8 5-1 9 1 9 5z" stroke="currentColor" strokeWidth="1.1" />
      <path d="M24 32c5-1 8-4 9-8-5-1-9 1-9 5z" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Monogram({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1" />
      <circle cx="32" cy="32" r="25" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <path
        d="M22 42V22l20 20V22"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flourish({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 160 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 12h56" stroke="currentColor" strokeWidth="1" />
      <path d="M100 12h56" stroke="currentColor" strokeWidth="1" />
      <path
        d="M80 3c-6 0-9 4-9 9s3 9 9 9 9-4 9-9-3-9-9-9z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M68 12c5-1 8-3 10-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M92 12c-5-1-8-3-10-7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}