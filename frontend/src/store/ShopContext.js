import React from 'react';

// Global shop state shared across the app (cart, language, products, etc.)
export const ShopCtx = React.createContext(null);
export const useShop = () => React.useContext(ShopCtx);
