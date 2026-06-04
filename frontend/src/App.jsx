/* ===========================================================
   App shell — global state, router, context, data fetching
   =========================================================== */
import React from 'react';
import { ShopCtx } from './store/ShopContext.js';
import { I18N } from './data/i18n.js';
import { api } from './api/client.js';

import { Header } from './components/chrome/Header.jsx';
import { Footer } from './components/chrome/Footer.jsx';
import { Toasts } from './components/ui/Toasts.jsx';
import { Logo } from './components/ui/Logo.jsx';

import { Home } from './pages/Home.jsx';
import { Catalog } from './pages/Catalog.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { Configurator } from './pages/Configurator.jsx';
import { Checkout, Confirmation, CartDrawer } from './pages/Checkout.jsx';
import { Admin } from './pages/Admin.jsx';

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
  const [route, setRoute] = React.useState({ page: 'home', params: {} });
  const [cart, setCart] = React.useState([]);
  const [cartOpen, setCartOpen] = React.useState(false);
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

  // ── initial data ──────────────────────────────────────────
  const refreshProducts = React.useCallback(() => api.products.list().then(setProducts), []);
  React.useEffect(() => {
    Promise.all([
      api.products.list().then(setProducts),
      api.meta().then((m) => setMeta({ wilayas: m.wilayas || [], communes: m.communes || {} })),
    ]).catch((e) => toast(e.message || 'Could not reach the server', 'warn')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── navigation ────────────────────────────────────────────
  const navigate = (page, params = {}) => { setRoute({ page, params }); window.scrollTo({ top: 0, behavior: 'auto' }); };

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
  };

  if (loading) return <Splash />;

  const p = route.page;
  const isAdmin = p === 'admin';

  return (
    <ShopCtx.Provider value={ctx}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {!isAdmin && <Header />}
        <main style={{ paddingBottom: isAdmin ? 0 : 40 }}>
          {p === 'home' && <Home />}
          {p === 'catalog' && <Catalog params={route.params} />}
          {p === 'product' && <ProductDetail params={route.params} />}
          {p === 'configurator' && <Configurator params={route.params} />}
          {p === 'checkout' && <Checkout />}
          {p === 'confirmation' && <Confirmation order={lastOrder} />}
          {p === 'admin' && <Admin />}
        </main>
        {!isAdmin && <Footer />}
        <CartDrawer />
        <Toasts items={toasts} />
      </div>
    </ShopCtx.Provider>
  );
}
