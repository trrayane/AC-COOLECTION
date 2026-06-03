import React from 'react';
import { Icon } from './Icon.jsx';

// Styled dropdown that replaces native <select>. Auto-adds a search box
// for long lists (e.g. the 58 wilayas).
export function Select({ value, onChange, options, placeholder = 'Select…', disabled, error, searchable, leftIcon, ariaLabel, style, triggerStyle, menuMaxH = 260 }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  const sel = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) return;
    const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', f);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k); };
  }, [open]);

  const useSearch = searchable || options.length > 10;
  const filtered = (useSearch && q) ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button type="button" disabled={disabled} aria-label={ariaLabel} onClick={() => !disabled && setOpen((o) => !o)} className="field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, textAlign: 'start',
          boxShadow: error ? 'inset 0 0 0 1.8px var(--danger)' : (open ? 'inset 0 0 0 1.8px var(--ink)' : 'inset 0 0 0 1.4px var(--line)'), ...triggerStyle }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, overflow: 'hidden' }}>
          {leftIcon && <Icon name={leftIcon} size={17} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: sel ? 'var(--ink)' : 'var(--ink-3)', fontWeight: sel ? 600 : 400 }}>{sel ? sel.label : placeholder}</span>
        </span>
        <Icon name="chevD" size={16} style={{ color: 'var(--ink-3)', flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, top: 'calc(100% + 6px)', zIndex: 70, background: 'var(--paper-2)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)', padding: 6, animation: 'selIn .16s cubic-bezier(.2,.8,.2,1) both' }}>
          {useSearch && (
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{ position: 'absolute', insetInlineStart: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={15} /></span>
              <input autoFocus className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="…" style={{ height: 38, paddingInlineStart: 32, fontSize: 13 }} />
            </div>
          )}
          <div className="no-bar" style={{ maxHeight: menuMaxH, overflowY: 'auto' }}>
            {filtered.length === 0 && <div className="dim" style={{ padding: '10px 12px', fontSize: 13 }}>—</div>}
            {filtered.map((o) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
                style={{ width: '100%', textAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', borderRadius: 9, fontSize: 14, fontWeight: o.value === value ? 700 : 500, transition: 'background .12s',
                  background: o.value === value ? 'var(--ink)' : 'transparent', color: o.value === value ? 'var(--paper)' : 'var(--ink)' }}
                onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = 'var(--sand)'; }}
                onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                {o.value === value && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
