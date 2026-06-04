/* ===========================================================
   Customization studio — upload · drag/drop placement · resize/rotate · note
   The uploaded design is sent to the backend so it travels with the order.
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { useIsMobile } from '../components/chrome/useIsMobile.js';
import { Icon } from '../components/ui/Icon.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Garment, GarmentTile, shade } from '../components/garments/Garment.jsx';
import { ProductImage } from '../components/product/ProductImage.jsx';
import { colorHex, colorTint, fmtDA, PRINT_ZONES } from '../data/constants.js';
import { api } from '../api/client.js';

// Print-zone rectangles as % of the (4:5) garment stage
const ZONE_RECTS = {
  tshirt: { front: { x: 30, y: 27, w: 40, h: 36 }, back: { x: 30, y: 24, w: 40, h: 42 }, sleeve: { x: 11, y: 22, w: 17, h: 15 }, pocket: { x: 39, y: 30, w: 16, h: 13 } },
  pull:   { front: { x: 33, y: 30, w: 34, h: 32 }, back: { x: 32, y: 26, w: 36, h: 40 }, sleeve: { x: 9, y: 26, w: 15, h: 18 } },
  hoodie: { front: { x: 33, y: 38, w: 34, h: 20 }, back: { x: 30, y: 22, w: 40, h: 42 }, sleeve: { x: 12, y: 30, w: 15, h: 16 }, hood: { x: 39, y: 9, w: 22, h: 13 } },
};
export const zoneView = (zone) => (zone === 'back' ? 'back' : 'front');

export function Configurator({ params }) {
  const { t, lang, navigate, addToCart, products, getProduct, toast } = useShop();
  const isMobile = useIsMobile();
  const [pid, setPid] = React.useState(params.id || '');
  const p = getProduct(pid) || products[0];
  const [color, setColor] = React.useState(params.color || '');
  const [size, setSize] = React.useState(null);
  const [zone, setZone] = React.useState('front');
  const [placements, setPlacements] = React.useState([]); // {id,zone,type,img|text,color,xPct,yPct,wPct,rot}
  const [sel, setSel] = React.useState(null);
  const [note, setNote] = React.useState('');
  const [textInput, setTextInput] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [sizeErr, setSizeErr] = React.useState(false);
  const [uploading, setUploading] = React.useState(0);
  const [guides, setGuides] = React.useState(null); // center-alignment guides while dragging
  const [preview, setPreview] = React.useState(false);
  const stageRef = React.useRef(null);
  const dragData = React.useRef(null);

  React.useEffect(() => { if (p && !p.colors.includes(color)) setColor(p.colors[0]); }, [p]);
  React.useEffect(() => { if (p && !PRINT_ZONES[p.cat].find((z) => z.id === zone)) setZone('front'); }, [p]);

  if (!p) return <div className="wrap dim" style={{ padding: '80px 24px' }}>{t.loading}</div>;

  const zones = PRINT_ZONES[p.cat];
  const view = zoneView(zone);
  const fee = 0; // customization is free (matches the "Free customization on every item" promise)
  const total = p.price + fee;
  const zonePlacements = placements.filter((pl) => zoneView(pl.zone) === view);

  // Real product photo as the customization canvas (front = photo 0, back = photo 1
  // if a second exists). Falls back to the drawn mockup only if no photo exists.
  const photoArr = (p.photos || []).map((ph) => ph.url);
  const baseImg = photoArr.length ? (view === 'back' ? (photoArr[1] || photoArr[0]) : photoArr[0]) : null;

  const addPlacement = (data) => {
    const rect = ZONE_RECTS[p.cat][zone] || ZONE_RECTS[p.cat].front;
    const id = 'd' + Date.now() + Math.random().toString(36).slice(2, 5);
    const pl = { id, zone, xPct: rect.x + rect.w / 2, yPct: rect.y + rect.h / 2, wPct: Math.min(rect.w * 0.8, 22), rot: 0, ...data };
    setPlacements((s) => [...s, pl]); setSel(id);
    return id;
  };
  const patchPlacement = (id, patch) => setPlacements((s) => s.map((pl) => (pl.id === id ? { ...pl, ...patch } : pl)));

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const id = addPlacement({ type: 'image', img: e.target.result, _uploading: true });
      setUploading((u) => u + 1);
      api.upload.design(file)
        .then(({ url }) => patchPlacement(id, { img: url, _uploading: false }))
        .catch((err) => { toast(err.message || 'Upload failed', 'warn'); setPlacements((s) => s.filter((pl) => pl.id !== id)); })
        .finally(() => setUploading((u) => Math.max(0, u - 1)));
    };
    reader.readAsDataURL(file);
  };
  const addText = () => { if (!textInput.trim()) return; addPlacement({ type: 'text', text: textInput.trim(), color: '#23211D', wPct: 34 }); setTextInput(''); };
  const updateSel = (patch) => setPlacements((s) => s.map((pl) => (pl.id === sel ? { ...pl, ...patch } : pl)));
  const removeSel = () => { setPlacements((s) => s.filter((pl) => pl.id !== sel)); setSel(null); };
  const selPl = placements.find((pl) => pl.id === sel);

  // ---- layers (z-order, duplicate) ----
  const reorder = (id, dir) => setPlacements((s) => {
    const t = s.find((pl) => pl.id === id); if (!t) return s;
    const group = s.map((pl, i) => ({ pl, i })).filter((x) => zoneView(x.pl.zone) === zoneView(t.zone));
    const pos = group.findIndex((x) => x.pl.id === id);
    const nb = group[pos + dir]; if (!nb) return s;
    const n = s.slice(); const a = group[pos].i, b = nb.i; const tmp = n[a]; n[a] = n[b]; n[b] = tmp; return n;
  });
  const duplicate = (id) => {
    const pl = placements.find((x) => x.id === id); if (!pl) return;
    const nid = 'd' + Date.now() + Math.random().toString(36).slice(2, 5);
    setPlacements((s) => [...s, { ...pl, id: nid, xPct: Math.min(pl.xPct + 4, 92), yPct: Math.min(pl.yPct + 4, 92) }]);
    setSel(nid);
  };

  // ---- drag / resize ----
  const onElemDown = (e, pl) => {
    e.stopPropagation(); setSel(pl.id);
    const rect = stageRef.current.getBoundingClientRect();
    dragData.current = { mode: 'move', id: pl.id, zone: pl.zone, rect, startX: e.clientX, startY: e.clientY, ox: pl.xPct, oy: pl.yPct };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  };
  const onResizeDown = (e, pl) => {
    e.stopPropagation(); setSel(pl.id);
    const rect = stageRef.current.getBoundingClientRect();
    dragData.current = { mode: 'resize', id: pl.id, rect, startX: e.clientX, ow: pl.wPct };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  };
  const onMove = (e) => {
    const d = dragData.current; if (!d) return;
    if (d.mode === 'move') {
      const zr = ZONE_RECTS[p.cat][d.zone] || ZONE_RECTS[p.cat].front;
      const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
      const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
      let nx = Math.max(zr.x, Math.min(zr.x + zr.w, d.ox + dx));
      let ny = Math.max(zr.y, Math.min(zr.y + zr.h, d.oy + dy));
      const cx = zr.x + zr.w / 2, cy = zr.y + zr.h / 2;
      const snapV = Math.abs(nx - cx) < 1.3, snapH = Math.abs(ny - cy) < 1.3;
      if (snapV) nx = cx;
      if (snapH) ny = cy;
      setGuides({ v: snapV, h: snapH, cx, cy });
      setPlacements((s) => s.map((pl) => (pl.id === d.id ? { ...pl, xPct: nx, yPct: ny } : pl)));
    } else {
      const dw = ((e.clientX - d.startX) / d.rect.width) * 100;
      const nw = Math.max(6, Math.min(60, d.ow + dw * 1.6));
      setPlacements((s) => s.map((pl) => (pl.id === d.id ? { ...pl, wPct: nw } : pl)));
    }
  };
  const onUp = () => { dragData.current = null; setGuides(null); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };

  const validate = () => {
    if (!size) { setSizeErr(true); return; }
    if (uploading > 0) { toast(t.cfg_uploading, 'warn'); return; }
    const clean = placements.map(({ _uploading, ...pl }) => pl); // strip internal flag
    addToCart({ pid: p.id, color, size, qty: 1, custom: true, customData: { note, zone, placements: clean, fee } });
    navigate('checkout');
  };

  const rect = ZONE_RECTS[p.cat][zone] || ZONE_RECTS[p.cat].front;

  const Stage = (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div ref={stageRef} onPointerDown={() => setSel(null)} style={{
        position: 'relative', aspectRatio: '4/5', borderRadius: 'var(--r-xl)', overflow: 'hidden',
        background: `radial-gradient(120% 120% at 50% 18%, ${colorTint(color)}, ${shade(colorTint(color), -10)})`,
        userSelect: 'none', touchAction: 'pan-y', /* let the page scroll when touching the photo; elements below capture their own drags */
      }}>
        {baseImg
          ? <img src={baseImg} alt={p['name_' + lang]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          : <Garment type={p.cat} color={colorHex(color)} view={view} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}

        <div style={{
          position: 'absolute', left: rect.x + '%', top: rect.y + '%', width: rect.w + '%', height: rect.h + '%',
          border: '1.5px dashed var(--clay)', borderRadius: 6, background: 'rgba(190,94,55,.05)', pointerEvents: 'none',
        }}>
          <span style={{ position: 'absolute', top: -10, insetInlineStart: 8, background: 'var(--clay)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '.04em' }}>
            {zones.find((z) => z.id === zone)[lang]}
          </span>
        </div>

        {zonePlacements.map((pl) => (
          <div key={pl.id} onPointerDown={(e) => onElemDown(e, pl)} style={{
            position: 'absolute', left: pl.xPct + '%', top: pl.yPct + '%', width: pl.wPct + '%',
            transform: `translate(-50%,-50%) rotate(${pl.rot}deg)`, cursor: 'grab', touchAction: 'none',
            outline: sel === pl.id ? '2px solid var(--clay)' : 'none', outlineOffset: 3, borderRadius: 2,
          }}>
            {pl.type === 'image' && <img src={pl.img} draggable="false" style={{ width: '100%', display: 'block', pointerEvents: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.18))', opacity: pl._uploading ? 0.6 : 1 }} />}
            {pl.type === 'text' && <div style={{ width: '100%', textAlign: 'center', fontWeight: 800, color: pl.color, fontSize: 'calc(' + pl.wPct + ' * 0.34px + 6px)', lineHeight: 1.05, pointerEvents: 'none', whiteSpace: 'nowrap' }}>{pl.text}</div>}
            {pl._uploading && <span className="spin" style={{ position: 'absolute', top: 4, insetInlineEnd: 4, borderTopColor: 'var(--clay)', borderColor: 'rgba(0,0,0,.2)' }} />}
            {sel === pl.id && (
              <div onPointerDown={(e) => onResizeDown(e, pl)} style={{
                position: 'absolute', insetInlineEnd: -9, bottom: -9, width: 18, height: 18, borderRadius: '50%',
                background: 'var(--clay)', border: '2px solid #fff', cursor: 'nwse-resize', touchAction: 'none', boxShadow: 'var(--shadow-sm)',
              }} />
            )}
          </div>
        ))}

        {placements.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(255,255,255,.78)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="image" size={16} /> {t.cfg_no_design}
            </div>
          </div>
        )}

        {guides && guides.v && <div style={{ position: 'absolute', left: guides.cx + '%', top: 0, bottom: 0, width: 1, background: 'var(--clay)', opacity: 0.7, transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
        {guides && guides.h && <div style={{ position: 'absolute', top: guides.cy + '%', left: 0, right: 0, height: 1, background: 'var(--clay)', opacity: 0.7, transform: 'translateY(-50%)', pointerEvents: 'none' }} />}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
        {zones.map((z) => (
          <button key={z.id} onClick={() => setZone(z.id)} className={'chip' + (zone === z.id ? ' on' : '')}>
            {z[lang]}{placements.some((pl) => pl.zone === z.id) ? <span style={{ width: 6, height: 6, borderRadius: 9, background: zone === z.id ? '#fff' : 'var(--clay)' }} /> : null}
          </button>
        ))}
      </div>

    </div>
  );

  // Read-only render of one side (used in the Preview modal)
  const renderSide = (side) => {
    const pls = placements.filter((pl) => zoneView(pl.zone) === side);
    const img = photoArr.length ? (side === 'back' ? (photoArr[1] || photoArr[0]) : photoArr[0]) : null;
    return (
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: colorTint(color) }}>
        {img
          ? <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Garment type={p.cat} color={colorHex(color)} view={side} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}
        {pls.map((pl) => (
          <div key={pl.id} style={{ position: 'absolute', left: pl.xPct + '%', top: pl.yPct + '%', width: pl.wPct + '%', transform: `translate(-50%,-50%) rotate(${pl.rot}deg)` }}>
            {pl.type === 'image' && <img src={pl.img} style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.18))' }} />}
            {pl.type === 'text' && <div style={{ width: '100%', textAlign: 'center', fontWeight: 800, color: pl.color, fontSize: 'calc(' + pl.wPct + ' * 0.34px + 6px)', lineHeight: 1.05, whiteSpace: 'nowrap' }}>{pl.text}</div>}
          </div>
        ))}
      </div>
    );
  };

  const Controls = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 64, height: 78, borderRadius: 12, background: colorTint(color), flexShrink: 0, overflow: 'hidden' }}><ProductImage p={p} color={color} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{p['name_' + lang]}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{fmtDA(p.price, lang)}</div>
            <Select value={p.id} onChange={(v) => { setPid(v); setPlacements([]); setSel(null); }} style={{ marginTop: 8 }} triggerStyle={{ height: 38, fontSize: 13 }}
              options={products.map((pp) => ({ value: pp.id, label: pp['name_' + lang] }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
          {p.colors.length > 1 && (
            <div>
              <div className="field-label">{t.select_color}</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {p.colors.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: colorHex(c), boxShadow: color === c ? '0 0 0 2px var(--paper-2),0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />)}
              </div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div className="field-label">{t.select_size} {sizeErr && <span style={{ color: 'var(--danger)' }}>*</span>}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {p.sizes.map((s) => { const soldOut = p.stock && p.stock[`${color}:${s}`] === 0; return <button key={s} disabled={soldOut} title={soldOut ? (lang === 'en' ? 'Out of stock' : 'نفد المخزون') : undefined} onClick={() => { if (soldOut) return; setSize(s); setSizeErr(false); }} style={{ minWidth: 38, height: 34, borderRadius: 9, fontWeight: 700, fontSize: 12.5, background: size === s ? 'var(--ink)' : 'var(--paper)', color: soldOut ? 'var(--ink-3)' : (size === s ? '#fff' : 'var(--ink)'), boxShadow: size === s ? 'none' : 'inset 0 0 0 1.3px var(--line)', opacity: soldOut ? 0.5 : 1, cursor: soldOut ? 'not-allowed' : 'pointer', textDecoration: soldOut ? 'line-through' : 'none' }}>{s}</button>; })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--ink)', color: 'var(--paper)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>1</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t.cfg_upload}</span>
        </div>
        <label onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files[0]); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 18px', borderRadius: 'var(--r-md)', cursor: 'pointer',
            border: '2px dashed ' + (dragOver ? 'var(--clay)' : 'var(--line-2)'), background: dragOver ? 'var(--clay-wash)' : 'var(--paper-2)', textAlign: 'center', transition: 'all .15s' }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--clay-wash)', color: 'var(--clay-deep)', display: 'grid', placeItems: 'center' }}><Icon name="upload" size={22} /></span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{t.cfg_upload_hint}</span>
          <span className="dim" style={{ fontSize: 12 }}>PNG · SVG · JPG</span>
          <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files[0])} />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input className="field" style={{ height: 44 }} placeholder={lang === 'en' ? 'Add text…' : 'أضف نصاً…'} value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addText()} />
          <button className="btn btn-primary" style={{ height: 44, flexShrink: 0 }} onClick={addText}><Icon name="plus" size={16} /></button>
        </div>
      </div>

      {zonePlacements.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <Icon name="layers" size={18} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{lang === 'en' ? 'Layers' : 'الطبقات'}</span>
            <span className="dim" style={{ fontSize: 12, marginInlineStart: 'auto' }}>{zones.find((z) => z.id === zone)[lang]}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...zonePlacements].reverse().map((pl) => (
              <div key={pl.id} onClick={() => setSel(pl.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 10, cursor: 'pointer', background: sel === pl.id ? 'var(--sand)' : 'transparent', boxShadow: sel === pl.id ? 'inset 0 0 0 1.4px var(--ink)' : 'inset 0 0 0 1px var(--line)' }}>
                <span style={{ width: 30, height: 30, borderRadius: 7, overflow: 'hidden', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 0 0 1px var(--line)' }}>
                  {pl.type === 'image' ? <img src={pl.img} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontWeight: 800, fontSize: 13, color: pl.color }}>T</span>}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.type === 'image' ? (lang === 'en' ? 'Image' : 'صورة') : pl.text}</span>
                <button onClick={(e) => { e.stopPropagation(); reorder(pl.id, 1); }} title={lang === 'en' ? 'Bring forward' : 'للأمام'} style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}><Icon name="chevD" size={15} style={{ transform: 'rotate(180deg)' }} /></button>
                <button onClick={(e) => { e.stopPropagation(); reorder(pl.id, -1); }} title={lang === 'en' ? 'Send backward' : 'للخلف'} style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}><Icon name="chevD" size={15} /></button>
                <button onClick={(e) => { e.stopPropagation(); duplicate(pl.id); }} title={lang === 'en' ? 'Duplicate' : 'تكرار'} style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}><Icon name="plus" size={15} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPlacements((s) => s.filter((x) => x.id !== pl.id)); if (sel === pl.id) setSel(null); }} title={t.remove} style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', color: 'var(--danger)' }}><Icon name="trash" size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selPl && (
        <div className="card fade-in" style={{ padding: 18, background: 'var(--clay-wash)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="move" size={16} /> {t.cfg_position}</span>
            <button onClick={removeSel} style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600 }}><Icon name="trash" size={15} /> {t.remove}</button>
          </div>
          <div style={{ fontSize: 12, marginBottom: 14 }} className="muted">{t.cfg_position_hint}</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}><span>{t.cfg_scale}</span><span>{Math.round(selPl.wPct)}%</span></div>
            <input type="range" min="6" max="60" value={selPl.wPct} onChange={(e) => updateSel({ wPct: +e.target.value })} style={{ width: '100%', accentColor: 'var(--clay)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}><span>{t.cfg_rotate}</span><span>{selPl.rot}°</span></div>
            <input type="range" min="-180" max="180" value={selPl.rot} onChange={(e) => updateSel({ rot: +e.target.value })} style={{ width: '100%', accentColor: 'var(--clay)' }} />
          </div>
          {selPl.type === 'text' && (
            <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
              {['#23211D', '#BE5E37', '#334A3A', '#C79A3B', '#F7F5F0'].map((c) => (
                <button key={c} onClick={() => updateSel({ color: c })} style={{ width: 26, height: 26, borderRadius: '50%', background: c, boxShadow: selPl.color === c ? '0 0 0 2px var(--clay-wash),0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--ink)', color: 'var(--paper)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>2</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t.cfg_note}</span>
        </div>
        <textarea className="field" rows="3" placeholder={t.cfg_note_hint} value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="dim" style={{ fontSize: 12, marginTop: 7, display: 'flex', gap: 6, alignItems: 'flex-start' }}><Icon name="note" size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {lang === 'en' ? 'The seller will receive this note with your order.' : 'سيستلم البائع هذه الملاحظة مع طلبك.'}</p>
      </div>

      <div className="card" style={{ padding: 18, position: 'sticky', bottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span className="muted">{p['name_' + lang]}</span><span>{fmtDA(p.price, lang)}</span></div>
        {fee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span className="muted">{lang === 'en' ? 'Customization' : 'التخصيص'}</span><span>{fmtDA(fee, lang)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, marginTop: 4, borderTop: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 700 }}>{t.co_total}</span><span style={{ fontWeight: 800, fontSize: 20 }}>{fmtDA(total, lang)}</span>
        </div>
        {sizeErr && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8, fontWeight: 600 }}>{lang === 'en' ? 'Choose a size.' : 'اختر المقاس.'}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn btn-ghost btn-lg" style={{ flexShrink: 0 }} onClick={() => setPreview(true)}><Icon name="eye" size={18} /> {lang === 'en' ? 'Preview' : 'معاينة'}</button>
          <button className="btn btn-clay btn-lg" style={{ flex: 1 }} disabled={uploading > 0} onClick={validate}>
            {uploading > 0 ? <><span className="spin" /> {t.cfg_uploading}</> : <><Icon name="check" size={18} /> {t.cfg_confirm}</>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(params.id ? 'product' : 'home', params.id ? { id: p.id, color } : {})}><Icon name="arrowL" size={15} /> {t.back}</button>
        <div style={{ marginTop: 16 }}>
          <span className="eyebrow" style={{ color: 'var(--clay-deep)' }}>{lang === 'en' ? 'Customization studio' : 'استوديو التخصيص'}</span>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', marginTop: 8 }}>{t.cfg_title}</h1>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 24, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 420px', gap: 36, alignItems: 'start' }}>
        <div style={{ position: isMobile ? 'static' : 'sticky', top: 84 }}>{Stage}</div>
        {Controls}
      </div>

      {preview && (
        <div className="fade-in" onClick={() => setPreview(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(10,10,10,.6)', display: 'grid', placeItems: 'center', padding: isMobile ? 12 : 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 'min(780px, calc(100vw - 20px))', maxHeight: '94vh', overflow: 'auto', animation: 'fadeUp .28s cubic-bezier(.2,.8,.2,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper-2)', zIndex: 2 }}>
              <div><div style={{ fontWeight: 800, fontSize: 18 }}>{lang === 'en' ? 'Preview' : 'معاينة'}</div><div className="dim" style={{ fontSize: 12.5 }}>{p['name_' + lang]}</div></div>
              <button onClick={() => setPreview(false)}><Icon name="close" size={22} /></button>
            </div>
            <div style={{ padding: 22, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
              <div><div style={{ maxWidth: 360, margin: '0 auto' }}>{renderSide('front')}</div><div className="center muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{t.cfg_front}</div></div>
              <div><div style={{ maxWidth: 360, margin: '0 auto' }}>{renderSide('back')}</div><div className="center muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{t.cfg_back}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0 22px 22px' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{fmtDA(total, lang)}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setPreview(false)}>{lang === 'en' ? 'Keep editing' : 'متابعة التعديل'}</button>
                <button className="btn btn-clay" onClick={() => { if (!size) { setSizeErr(true); setPreview(false); toast(lang === 'en' ? 'Choose a size first' : 'اختر المقاس أولاً', 'warn'); return; } setPreview(false); validate(); }}><Icon name="check" size={17} /> {t.cfg_confirm}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
