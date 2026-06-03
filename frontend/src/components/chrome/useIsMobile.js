import React from 'react';

// True when the viewport is narrower than `bp` (mobile layout).
export function useIsMobile(bp = 860) {
  const [m, setM] = React.useState(typeof window !== 'undefined' && window.innerWidth < bp);
  React.useEffect(() => {
    const f = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [bp]);
  return m;
}
