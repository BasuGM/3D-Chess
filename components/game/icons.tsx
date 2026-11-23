import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      {children}
    </svg>
  );
}

export function UndoIcon() {
  return (
    <Svg>
      <path d="M8 8H4v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12a8 8 0 1 0 2.2-5.5" strokeLinecap="round" />
    </Svg>
  );
}

export function RedoIcon() {
  return (
    <Svg>
      <path d="M16 8h4v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12a8 8 0 1 1-2.2-5.5" strokeLinecap="round" />
    </Svg>
  );
}

export function RestartIcon() {
  return (
    <Svg>
      <path d="M5 12a7 7 0 1 0 2-4.9" strokeLinecap="round" />
      <path d="M5 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SettingsIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function FullscreenIcon() {
  return (
    <Svg>
      <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FlipIcon() {
  return (
    <Svg>
      <path d="M7 8h10l-2.2-2.2M17 16H7l2.2 2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MenuIcon() {
  return (
    <Svg>
      <path d="M5 7h14M5 12h14M5 17h14" strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon() {
  return (
    <Svg>
      <path d="M4 9h3l1.4-2h7.2L17 9h3v9H4V9z" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="2.4" />
    </Svg>
  );
}
