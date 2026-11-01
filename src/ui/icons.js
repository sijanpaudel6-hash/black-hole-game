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
  share: svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
  calendar: svg('<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  timer: svg('<circle cx="12" cy="13" r="7"/><path d="M12 9v4h3M10 3h4"/>'),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5M12 3.5C9.5 6 8.5 9 8.5 12s1 6 3.5 8.5"/>'),
  // Cosmic powers and synergies
  kerrSpin: svg('<path d="M12 12c0-1.2 1.6-1.8 2.4-.8 1 1.3-.2 3.6-2.6 3.6-2.8 0-4.4-3-3-5.6 1.6-3 6.4-3.4 8.6-.4 2.4 3.4.4 8.6-4.6 9.2"/>'),
  jets: svg('<circle cx="12" cy="12" r="3"/><path d="M12 9V2M12 15v7M9.5 4.5L12 2l2.5 2.5M9.5 19.5L12 22l2.5-2.5"/>'),
  shredder: svg('<circle cx="12" cy="12" r="3"/><path d="M3 6l3 .5-.5 3 3 .5M21 18l-3-.5.5-3-3-.5M17 4l-1 2.5M7 20l1-2.5"/>'),
  halo: svg('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 3"/>'),
  lens: svg('<circle cx="12" cy="12" r="3"/><path d="M2 12c4-6.5 16-6.5 20 0M2 12c4 6.5 16 6.5 20 0"/>'),
  bloom: svg('<circle cx="12" cy="12" r="2.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2L19 19M5 19l2.8-2.8M16.2 7.8L19 5"/>'),
  pulsar: svg('<circle cx="12" cy="12" r="2.5"/><path d="M14 10l7-5M10 14l-7 5"/><path d="M20 12a8 8 0 01-8 8M4 12a8 8 0 018-8" stroke-dasharray="2 2.5"/>'),
  buzzsaw: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3l2 2.5 3-1 .2 3.2 3 1.3-2 2.5 2 2.5-3 1.3-.2 3.2-3-1-2 2.5-2-2.5-3 1-.2-3.2-3-1.3 2-2.5-2-2.5 3-1.3.2-3.2 3 1z"/>'),
  lensedJets: svg('<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C12 5 16 3 20 4M12 14.5c0 4.5-4 6.5-8 5.5"/><circle cx="20" cy="4" r="1.2"/>'),
  darkMatterDrip: svg('<path d="M12 3c3 5 6 8 6 11a6 6 0 01-12 0c0-3 3-6 6-11z"/><circle cx="12" cy="15" r="2"/>'),
};
