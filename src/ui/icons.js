// Simple line icons (inline SVG, stroke = currentColor).

const svg = (body, vb = '0 0 24 24') => `<svg class="icon" viewBox="${vb}" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  play: svg('<path d="M7 5l12 7-12 7z"/>'),
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  record: svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  book: svg('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>'),
  gravityPull: svg('<circle cx="12" cy="12" r="2.5"/><path d="M12 4a8 8 0 018 8M12 20a8 8 0 01-8-8M7 7a7 7 0 0110 0"/><path d="M17 17a7 7 0 01-10 0"/>'),
  thrusters: svg('<path d="M12 3l3 7h-6z"/><path d="M9 10v6l-3 3M15 10v6l3 3M12 10v9"/>'),
  headStart: svg('<circle cx="12" cy="12" r="8"/><path d="M12 7v10M8 11l4-4 4 4"/>'),
  timeDilation: svg('<circle cx="12" cy="13" r="7"/><path d="M12 9v4l3 2M9 3h6M18 6l1.5-1.5"/>'),
  hawkingShield: svg('<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><circle cx="12" cy="12" r="2.5"/>'),
  darkMatterDrip: svg('<path d="M12 3c3 5 6 8 6 11a6 6 0 01-12 0c0-3 3-6 6-11z"/><circle cx="12" cy="15" r="2"/>'),
};
