export const MAINTENANCE_PRODUCTS = [
  { key: 'bl', hifiveKey: 'bl', code: 100, name: 'Nogatu Barley Juice', price: 850, image: '/legacy-img/Barley-Mix.png' },
  { key: 'gl', hifiveKey: 'gl', code: 101, name: 'Nogatu Glow', price: 550, image: '/legacy-img/Glow-Pill.png' },
  { key: 'glc', hifiveKey: 'glc', code: 102, name: 'Vitamin C with Collagen & Glutathione', price: 500, image: '/legacy-img/Vitamin-C-Collagen.png' },
  { key: 'cm', hifiveKey: 'cm', code: 103, name: 'Nogatu Coffee Mix', price: 495, image: '/legacy-img/Coffee-Mix.png' },
  { key: 'cd', hifiveKey: 'cd', code: 104, name: 'Chocolate Drink Mix', price: 710, image: '/legacy-img/Chox-Mix.png' },
  { key: 'mgt', hifiveKey: 'mgt', code: 105, name: 'Mangosteen Coffee Mix', price: 375, image: '/legacy-img/Mangoosteen_1.png' },
  { key: 'vc', hifiveKey: 'vz', code: 106, name: 'Vitamin C with Zinc & Mangosteen', price: 580, image: '/legacy-img/Vitamin-C.png' },
  { key: 'cmm', hifiveKey: 'cmm', code: 107, name: 'Nogatu Max Fuel Coffee Drink Mix', price: 2500, image: '/legacy-img/Max-Fuel.png' },
  { key: 'bkc', hifiveKey: 'bkc', code: 108, name: 'Nogatu Black Coffee', price: 250, image: '/legacy-img/blck-coffee.png' },
  { key: 'bnad', hifiveKey: 'bnad', code: 109, name: 'Berry NAD+', price: 7998, image: '/legacy-img/Berry-Nad.png' },
];

export const VOUCHER_MEMBER_DISCOUNT_RATE = 0.3;
export const VOUCHER_MEMBER_DISCOUNT_PERCENT = Math.round(VOUCHER_MEMBER_DISCOUNT_RATE * 100);

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function getVoucherMemberPricing(price) {
  const originalPrice = roundCurrency(price);
  const discountValue = roundCurrency(originalPrice * VOUCHER_MEMBER_DISCOUNT_RATE);
  const memberPrice = roundCurrency(originalPrice - discountValue);

  return {
    originalPrice,
    discountRate: VOUCHER_MEMBER_DISCOUNT_RATE,
    discountPercent: VOUCHER_MEMBER_DISCOUNT_PERCENT,
    discountValue,
    memberPrice,
  };
}

export const MAINTENANCE_PRODUCT_IMAGES = Object.fromEntries(
  MAINTENANCE_PRODUCTS.map((product) => [product.key, product.image])
);

export const HIFIVE_PRODUCT_IMAGES = Object.fromEntries(
  MAINTENANCE_PRODUCTS.map((product) => [product.hifiveKey, product.image])
);

export const MAINTENANCE_PRODUCT_OPTIONS = MAINTENANCE_PRODUCTS.map((product) => ({
  value: product.code,
  label: `${product.name} (Maintenance)`,
  color: '#6b7280',
}));
