// Decorative inline icons (aria-hidden). Always paired with a visible text label.
type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
  </Svg>
);
export const TripsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="5" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M6 7.5V11a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v-.5" />
  </Svg>
);
export const MemoriesIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);
export const PlacesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);
export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
    <circle cx="16" cy="7" r="2.3" />
    <circle cx="8" cy="17" r="2.3" />
  </Svg>
);
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
);
export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </Svg>
);

/** Brand mark: two stations joined by a line. */
export function BrandMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true" focusable="false" className={className}>
      <rect x="9" y="8" width="6" height="16" rx="3" fill="currentColor" />
      <circle cx="12" cy="7" r="5" fill="var(--paper)" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="12" cy="25" r="5" fill="var(--paper)" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  );
}
