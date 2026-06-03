/* ===========================================================
   Catalog — filters + grid
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { useIsMobile } from '../components/chrome/useIsMobile.js';
import { Icon } from '../components/ui/Icon.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { COLORS, CATEGORIES, SIZES, colorHex, colorLabel, fmtDA } from '../data/constants.js';

function FilterGroup({ title, children }) {
  return (
    <div style={{ paddingBottom: 22, marginBottom: 22, borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function FiltersPanel({ f, setF, lang, t, colors }) {
  const allColors = colors;
  const toggle = (key, val) => setF((s) => {
    const arr = s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val];
    return { ...s, [key]: arr };
  });
  return (
    <div>
      <FilterGroup title={t.category}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={'chip' + (f.cat === c.id ? ' on' : '')} onClick={() => setF((s) => ({ ...s, cat: c.id }))}>{c[lang]}</button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title={t.color}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {allColors.map((c) => (
            <button key={c} onClick={() => toggle('colors', c)} title={colorLabel(c, lang)} style={{
              width: 30, height: 30, borderRadius: '50%', background: colorHex(c),
              boxShadow: f.colors.includes(c) ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(0,0,0,.12)',
              transition: 'box-shadow .15s',
            }} />
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title={t.size}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SIZES.map((s) => (
            <button key={s} onClick={() => toggle('sizes', s)} style={{
              minWidth: 44, height: 40, borderRadius: 10, fontWeight: 700, fontSize: 13,
              background: f.sizes.includes(s) ? 'var(--ink)' : 'var(--paper-2)', color: f.sizes.includes(s) ? 'var(--paper)' : 'var(--ink)',
              boxShadow: f.sizes.includes(s) ? 'none' : 'inset 0 0 0 1.4px var(--line)',
            }}>{s}</button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title={t.price}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          <span className="muted">{fmtDA(0, lang)}</span><span style={{ color: 'var(--clay-deep)' }}>{lang === 'en' ? 'Up to' : 'حتى'} {fmtDA(f.maxPrice, lang)}</span>
        </div>
        <input type="range" min="2000" max="8000" step="100" value={f.maxPrice}
          onChange={(e) => setF((s) => ({ ...s, maxPrice: +e.target.value }))}
          style={{ width: '100%', accentColor: 'var(--clay)' }} />
      </FilterGroup>
    </div>
  );
}

export function Catalog({ params, gridVariant = 'standard' }) {
  const { t, lang, products } = useShop();
  const isMobile = useIsMobile();
  const [sheet, setSheet] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState(params.sort || 'pop');
  const [f, setF] = React.useState({
    cat: params.cat || 'all', colors: [], sizes: [], maxPrice: 8000, onlyNew: params.filter === 'new',
  });
  React.useEffect(() => {
    setF((s) => ({ ...s, cat: params.cat || 'all', onlyNew: params.filter === 'new' }));
    if (params.sort) setSort(params.sort);
  }, [params.cat, params.filter, params.sort]);

  let list = products.filter((p) => {
    if (f.cat !== 'all' && p.cat !== f.cat) return false;
    if (f.onlyNew && !p.new) return false;
    if (f.colors.length && !p.colors.some((c) => f.colors.includes(c))) return false;
    if (f.sizes.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
    if (p.price > f.maxPrice) return false;
    if (query && !(p['name_' + lang] || '').toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const sorters = {
    pop: (a, b) => b.sold - a.sold, new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
    price_a: (a, b) => a.price - b.price, price_d: (a, b) => b.price - a.price,
  };
  list = [...list].sort(sorters[sort] || sorters.pop);

  const activeCount = (f.cat !== 'all' ? 1 : 0) + f.colors.length + f.sizes.length + (f.maxPrice < 8000 ? 1 : 0) + (f.onlyNew ? 1 : 0);
  const clearAll = () => { setF({ cat: 'all', colors: [], sizes: [], maxPrice: 8000, onlyNew: false }); setQuery(''); };

  // Colours actually present in the catalog (presets + custom hex), preset order first.
  const availableColors = React.useMemo(() => {
    const seen = new Set();
    products.forEach((p) => (p.colors || []).forEach((c) => seen.add(c)));
    const presets = Object.keys(COLORS).filter((k) => seen.has(k));
    const customs = [...seen].filter((c) => !COLORS[c]);
    return [...presets, ...customs];
  }, [products]);

  const gridClass = gridVariant === 'roomy' ? 'prod-grid-3' : gridVariant === 'editorial' ? 'prod-grid-ed' : 'prod-grid';
  const sortOptions = [['pop', t.sort_pop], ['new', t.sort_new], ['price_a', t.sort_price_a], ['price_d', t.sort_price_d]];

  return (
    <div className="wrap fade-in" style={{ paddingTop: 28, minHeight: '70vh' }}>
      <div style={{ marginBottom: 22 }}>
        <span className="eyebrow" style={{ color: 'var(--clay-deep)' }}>{t.catalog}</span>
        <h1 style={{ fontSize: 'clamp(30px,4.5vw,46px)', marginTop: 8 }}>
          {f.cat === 'all' ? (lang === 'en' ? 'The whole collection' : 'كل المجموعة') : CATEGORIES.find((c) => c.id === f.cat)[lang]}
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 0 }}>
          <span style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={18} /></span>
          <input className="field" style={{ paddingInlineStart: 42 }} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {isMobile && (
          <button className="btn btn-ghost" onClick={() => setSheet(true)}><Icon name="filter" size={17} /> {t.filters}{activeCount > 0 ? ` (${activeCount})` : ''}</button>
        )}
        <Select value={sort} onChange={setSort} ariaLabel={t.sort} style={{ width: isMobile ? '100%' : 230 }}
          options={sortOptions.map(([v, l]) => ({ value: v, label: t.sort + ' · ' + l }))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '236px 1fr', gap: 30, alignItems: 'start' }}>
        {!isMobile && (
          <aside style={{ position: 'sticky', top: 84 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="filter" size={18} /> {t.filters}</span>
              {activeCount > 0 && <button onClick={clearAll} style={{ fontSize: 13, color: 'var(--clay-deep)', fontWeight: 600 }}>{t.clear}</button>}
            </div>
            <FiltersPanel f={f} setF={setF} lang={lang} t={t} colors={availableColors} />
          </aside>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>{list.length} {t.results}</span>
            {activeCount > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {f.onlyNew && <span className="chip on">{t.nav_new}</span>}
                {f.colors.map((c) => <button key={c} className="chip" onClick={() => setF((s) => ({ ...s, colors: s.colors.filter((x) => x !== c) }))}><span style={{ width: 12, height: 12, borderRadius: 9, background: colorHex(c) }} /> {colorLabel(c, lang)} <Icon name="close" size={12} /></button>)}
                {f.sizes.map((s) => <button key={s} className="chip" onClick={() => setF((st) => ({ ...st, sizes: st.sizes.filter((x) => x !== s) }))}>{s} <Icon name="close" size={12} /></button>)}
              </div>
            )}
          </div>

          {list.length === 0 ? (
            <div className="center" style={{ padding: '80px 0', color: 'var(--ink-3)' }}>
              <Icon name="search" size={40} /><p style={{ marginTop: 14, fontSize: 16 }}>{lang === 'en' ? 'No items match your filters.' : 'لا توجد نتائج.'}</p>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={clearAll}>{t.clear}</button>
            </div>
          ) : (
            <div className={gridClass}>
              {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {sheet && (
        <div className="fade-in" onClick={() => setSheet(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(34,28,19,.45)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', insetInline: 0, bottom: 0, maxHeight: '86vh', overflow: 'auto', background: 'var(--paper)', borderRadius: '22px 22px 0 0', padding: 22, animation: 'fadeUp .25s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontWeight: 800, fontSize: 20 }}>{t.filters}</span>
              <button onClick={() => setSheet(false)}><Icon name="close" size={22} /></button>
            </div>
            <FiltersPanel f={f} setF={setF} lang={lang} t={t} colors={availableColors} />
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <button className="btn btn-ghost btn-block" onClick={clearAll}>{t.clear}</button>
              <button className="btn btn-primary btn-block" onClick={() => setSheet(false)}>{list.length} {t.results}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
