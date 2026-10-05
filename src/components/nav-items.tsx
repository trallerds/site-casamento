type IconProps = { className?: string };

export function HomeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 11l8-6 8 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5V19h11v-8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GiftIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="9" width="16" height="10" rx="1.2" />
      <path d="M4 13h16M12 9v10" strokeLinecap="round" />
      <path d="M12 9c-2.5 0-4.5-.6-4.5-2.2C7.5 5.6 8.6 5 9.6 5c1.4 0 2.4 1.8 2.4 4zM12 9c2.5 0 4.5-.6 4.5-2.2 0-1.2-1.1-1.8-2.1-1.8-1.4 0-2.4 1.8-2.4 4z" />
    </svg>
  );
}

export function CameraIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export const NAV = [
  { href: "/", label: "Início", icon: HomeIcon },
  { href: "/presentes", label: "Presentes", icon: GiftIcon },
  { href: "/fotos", label: "Fotos", icon: CameraIcon },
];
