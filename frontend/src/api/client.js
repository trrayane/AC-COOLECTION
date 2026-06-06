/* ===========================================================
   Single place that talks to the backend API.
   Base URL comes from VITE_API_URL (see frontend/.env).
   =========================================================== */

import { compressImage } from '../utils/compress.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'ac_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

// Friendly, localized messages (lang read from storage; app uses en/ar).
function msg(en, ar) {
  let lang = 'en';
  try { lang = localStorage.getItem('cshop_lang') || 'en'; } catch (e) {}
  return lang === 'ar' ? ar : en;
}
function httpMessage(status) {
  if (status === 429 || status === 403) return msg('Too many requests — please wait a moment and try again.', 'طلبات كثيرة — انتظر لحظة وحاول مجدداً.');
  if (status === 401) return msg('Session expired — please sign in again.', 'انتهت الجلسة — سجّل الدخول من جديد.');
  if (status >= 500) return msg('The server had a problem. Please try again.', 'حدث خطأ في الخادم. حاول مرة أخرى.');
  return msg('Something went wrong. Please try again.', 'حدث خطأ ما. حاول مرة أخرى.');
}

async function req(path, { method = 'GET', body, auth = false, form = false } = {}) {
  const headers = {};
  if (!form) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = 'Bearer ' + t;
  }
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers,
      body: form ? body : (body ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    // Network down / offline / IP blocked / CORS → never show raw "Failed to fetch"
    throw new Error(msg('Connection problem. Check your internet and try again.', 'مشكلة في الاتصال. تحقق من الإنترنت وحاول مجدداً.'));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || httpMessage(res.status));
  return data;
}

export const api = {
  base: API,
  meta: () => req('/api/meta'),

  auth: {
    login: (username, password) => req('/api/auth/login', { method: 'POST', body: { username, password } }),
    me: () => req('/api/auth/me', { auth: true }),
  },

  products: {
    list: () => req('/api/products'),
    get: (id) => req('/api/products/' + id),
    create: (data) => req('/api/products', { method: 'POST', body: data, auth: true }),
    update: (id, data) => req('/api/products/' + id, { method: 'PUT', body: data, auth: true }),
    remove: (id) => req('/api/products/' + id, { method: 'DELETE', auth: true }),
    addPhotos: async (id, files) => {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append('photos', await compressImage(f));
      return req(`/api/products/${id}/photos`, { method: 'POST', body: fd, auth: true, form: true });
    },
    removePhoto: (id, photoId) => req(`/api/products/${id}/photos/${photoId}`, { method: 'DELETE', auth: true }),
  },

  orders: {
    create: (data) => req('/api/orders', { method: 'POST', body: data }),
    list: () => req('/api/orders', { auth: true }),
    get: (id) => req('/api/orders/' + id, { auth: true }),
    setStatus: (id, status) => req(`/api/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    remove: (id) => req('/api/orders/' + id, { method: 'DELETE', auth: true }),
    clear: (status) => req('/api/orders?status=' + encodeURIComponent(status), { method: 'DELETE', auth: true }),
  },

  stockAlerts: {
    register: (data) => req('/api/stock-alerts', { method: 'POST', body: data }),
    list: () => req('/api/stock-alerts', { auth: true }),
    done: (id) => req('/api/stock-alerts/' + id + '/done', { method: 'PATCH', auth: true }),
  },

  promo: {
    validate: (code) => req('/api/promo/validate', { method: 'POST', body: { code } }),
    list: () => req('/api/promo', { auth: true }),
    create: (data) => req('/api/promo', { method: 'POST', body: data, auth: true }),
    update: (id, data) => req('/api/promo/' + id, { method: 'PUT', body: data, auth: true }),
    remove: (id) => req('/api/promo/' + id, { method: 'DELETE', auth: true }),
  },

  upload: {
    design: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return req('/api/upload/design', { method: 'POST', body: fd, form: true });
    },
  },
};
