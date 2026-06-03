import React from 'react';

// Stroke icons on a 24 grid.
export const ICONS = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  cart: 'M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L21 8H6',
  bag: 'M6 8V7a6 6 0 0 1 12 0v1M4 8h16l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20.5L4 8Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  heart: 'M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z',
  filter: 'M3 5h18M6 12h12M10 19h4',
  sort: 'M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3',
  close: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  arrowL: 'M19 12H5M11 6l-6 6 6 6',
  chev: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5 10 17 19 7',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
  truck: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z',
  lock: 'M8 10V7a4 4 0 0 1 8 0v3M5 10h14v10H5zM12 14v3',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  rows: 'M4 5h16M4 12h16M4 19h16',
  trash: 'M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13',
  edit: 'M4 20h4L18 10l-4-4L4 16zM14 6l4 4',
  box: 'M3 7l9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7M12 11v10',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  rotate: 'M4 12a8 8 0 1 1 2.3 5.6M4 18v-4h4',
  move: 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v2a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-3Z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  note: 'M5 3h11l3 3v15H5zM15 3v4h4M8 12h8M8 16h6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 3 7H3c1-1 3-2 3-7M9.5 20a2.5 2.5 0 0 0 5 0',
  calendar: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v13H4zM4 10h16M8 3v4M16 3v4',
  logout: 'M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11',
  tag: 'M3 3h7l11 11-7 7L3 10zM7.5 7.5h.01',
  layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
};

export function Icon({ name, size = 20, stroke = 2, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
         style={style} className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}
