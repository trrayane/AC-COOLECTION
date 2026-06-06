/* ===========================================================
   App shell — global state, router, context, data fetching
   =========================================================== */
import React from 'react';
import { ShopCtx } from './store/ShopContext.js';
import { I18N } from './data/i18n.js';
import { api } from './api/client.js';

import { Header } from './components/chrome/Header.jsx';
import { Footer } from './components/chrome/Footer.jsx';
import { WhatsAppButton } from './components/chrome/WhatsAppButton.jsx';
import { Toasts } from './components/ui/Toasts.jsx';
import { Logo } from './components/ui/Logo.jsx';

import { Home } from './pages/Home.jsx';
import { Catalog } from './pages/Catalog.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { Configurator } from './pages/Configurator.jsx';
import { Checkout, Confirmation, CartDrawer } from './pages/Checkout.jsx';
import { Admin } from './pages/Admin.jsx';
import { Wishlist } from './pages/Wishlist.jsx';
import { Promotions } from './pages/Promotions.jsx';
import { NotFound } from './pages/NotFound.jsx';

// ── Browser-history routing helpers ─────────────────────────
const ROUTES = ['home', 'catalog', 'product', 'configurator', 'checkout', 'confirmation', 'wishlist', 'promotions', 'admin'];
function parsePath() {
  const seg = (typeof window !== 'undefined' ? window.location.pathname : '/').split('/').filter(Boolean);
  const page = seg[0] || 'home';
  if (!ROUTES.includes(page)) return { page: 'notfound', params: {} };
  const params = {};
  if ((page === 'product' || page === 'configurator') && seg[1]) params.id = decodeURIComponent(seg[1]);
  return { page, params };
}
function urlFor(page, params = {}) {
  if (page === 'home') return '/';
  let u = '/' + page;
  if ((page === 'product' || page === 'configurator') && params.id) u += '/' + encodeURIComponent(params.id);
  return u;
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}>
      <div className="fade-in" style={{ textAlign: 'center' }}>
        <Logo size={26} />
        <div className="dots" style={{ marginTop: 24 }}><span /><span /><span /></div>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLangState] = React.useState(() => localStorage.getItem('cshop_lang') || 'en');
  const [route, setRoute] = React.useState(() => parsePath());
  const [cart, setCart] = React.useState([]);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlist, setWishlist] = React.useState(() => { try { return JSON.parse(localStorage.getItem('cshop_wishlist') || '[]'); } catch (e) { return []; } });
  const [products, setProducts] = React.useState([]);
  const [meta, setMeta] = React.useState({ wilayas: [], communes: {} });
  const [toasts, setToasts] = React.useState([]);
  const [lastOrder, setLastOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const t = I18N[lang];

  // ── language / direction ──────────────────────────────────
  const setLang = (l) => { setLangState(l); localStorage.setItem('cshop_lang', l); };
  React.useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
  }, [lang]);

  // ── wishlist (saved in the browser) ──────────────────────
  React.useEffect(() => { localStorage.setItem('cshop_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  const toggleWishlist = (id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const isWishlisted = (id) => wishlist.includes(id);

  // ── initial data ──────────────────────────────────────────
  const refreshProducts = React.useCallback(() => api.products.list().then(setProducts), []);
  React.useEffect(() => {
    Promise.all([
      api.products.list().then(setProducts),
      api.meta().then((m) => setMeta({ wilayas: m.wilayas || [], communes: m.communes || {} })),
    ]).catch((e) => toast(e.message || 'Could not reach the server', 'warn')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── navigation (synced with browser history so ◀/▶ work) ──
  const navigate = (page, params = {}) => {
    setRoute({ page, params });
    window.scrollTo({ top: 0, behavior: 'auto' });
    try { window.history.pushState({ page, params }, '', urlFor(page, params)); } catch (e) {}
  };
  React.useEffect(() => {
    try { window.history.replaceState({ page: route.page, params: route.params }, '', urlFor(route.page, route.params)); } catch (e) {}
    const onPop = (e) => {
      const s = (e.state && e.state.page) ? e.state : parsePath();
      setRoute({ page: s.page, params: s.params || {} });
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── helpers ───────────────────────────────────────────────
  const getProduct = (id) => products.find((p) => p.id === id);
  const unitPrice = (it) => { const p = getProduct(it.pid); return (p ? p.price : 0) + (it.customData && it.customData.fee ? it.customData.fee : 0); };
  const communesFor = (w) => (meta.communes && meta.communes[w]) || ['Chef-lieu', 'Autre commune'];

  // ── toasts ────────────────────────────────────────────────
  const toast = (msg, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2800);
  };

  // ── cart ──────────────────────────────────────────────────
  const addToCart = (item) => setCart((c) => {
    if (!item.custom) {
      const idx = c.findIndex((x) => x.pid === item.pid && x.color === item.color && x.size === item.size && !x.custom);
      if (idx >= 0) { const n = c.slice(); n[idx] = { ...n[idx], qty: n[idx].qty + item.qty }; return n; }
    }
    return [...c, item];
  });
  const removeFromCart = (i) => setCart((c) => c.filter((_, idx) => idx !== i));
  const updateQty = (i, d) => setCart((c) => c.map((it, idx) => (idx === i ? { ...it, qty: Math.max(1, it.qty + d) } : it)));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + unitPrice(i) * i.qty, 0);

  // ── orders ────────────────────────────────────────────────
  const placeOrder = async (info) => {
    const items = cart.map((it) => ({
      productId: it.pid, color: it.color, size: it.size, qty: it.qty,
      custom: !!it.custom, customData: it.customData,
    }));
    const order = await api.orders.create({
      name: info.name, phone: info.phone, wilaya: info.wilaya, commune: info.commune,
      address: info.address, deliveryMode: info.deliveryMode, note: info.note, items,
    });
    setLastOrder(order);
    setCart([]);
    refreshProducts(); // stock changed
    navigate('confirmation');
    return order;
  };

  // ── product mutations (admin) ─────────────────────────────
  const saveProduct = async (f) => {
    try {
      const payload = {
        name_en: f.name_en, name_ar: f.name_ar, cat: f.cat, price: f.price,
        colors: f.colors, sizes: f.sizes || undefined, new: !!f.new,
        oldPrice: f.oldPrice ?? null, stock: f.stock,
      };
      const saved = f.id ? await api.products.update(f.id, payload) : await api.products.create(payload);
      if (f._photos && f._photos.length) await api.products.addPhotos(saved.id, f._photos);
      await refreshProducts();
      toast(f.id ? (lang === 'ar' ? 'تم الحفظ' : 'Product saved') : (lang === 'ar' ? 'تم الإضافة' : 'Product added'));
      return true;
    } catch (e) { toast(e.message || 'Save failed', 'warn'); return false; }
  };
  const deleteProduct = async (id) => {
    try { await api.products.remove(id); await refreshProducts(); toast(lang === 'ar' ? 'تم الحذف' : 'Product deleted', 'warn'); }
    catch (e) { toast(e.message, 'warn'); }
  };
  const addPhotos = async (pid, files) => {
    try { await api.products.addPhotos(pid, files); await refreshProducts(); toast(lang === 'ar' ? 'تمت إضافة الصور' : (files.length > 1 ? files.length + ' photos added' : 'Photo added')); }
    catch (e) { toast(e.message, 'warn'); }
  };
  const removePhotoAt = async (pid, photoId) => {
    try { await api.products.removePhoto(pid, photoId); await refreshProducts(); }
    catch (e) { toast(e.message, 'warn'); }
  };

  const ctx = {
    t, lang, setLang, route, navigate,
    products, getProduct, refreshProducts,
    cart, cartCount, cartSubtotal, cartOpen, openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false),
    addToCart, removeFromCart, updateQty,
    placeOrder, saveProduct, deleteProduct, addPhotos, removePhotoAt,
    wilayas: meta.wilayas, communesFor, toast,
    wishlist, toggleWishlist, isWishlisted, wishlistCount: wishlist.length,
  };

  if (loading) return <Splash />;

  const p = route.page;
  const isAdmin = p === 'admin';

  return (
    <ShopCtx.Provider value={ctx}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--paper)' }}>
        {!isAdmin && <Header />}
        <main style={{ flex: 1, paddingBottom: isAdmin ? 0 : 40 }}>
          {p === 'home' && <Home />}
          {p === 'catalog' && <Catalog params={route.params} />}
          {p === 'product' && <ProductDetail params={route.params} />}
          {p === 'configurator' && <Configurator params={route.params} />}
          {p === 'checkout' && <Checkout />}
          {p === 'confirmation' && <Confirmation order={lastOrder} />}
          {p === 'wishlist' && <Wishlist />}
          {p === 'promotions' && <Promotions />}
          {p === 'notfound' && <NotFound />}
          {p === 'admin' && <Admin />}
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <WhatsAppButton />}
        <CartDrawer />
        <Toasts items={toasts} />
      </div>
    </ShopCtx.Provider>
  );
}
