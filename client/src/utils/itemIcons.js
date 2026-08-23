/**
 * Smart item image resolver — NO JSX (pure JS for .js compatibility)
 * Priority:
 *  1. Customer-uploaded photo URL  → show real <img>
 *  2. Name keyword matching        → emoji on coloured bg
 *  3. Category-based icon         → emoji on coloured bg
 *  4. Generic package icon
 */
import React from 'react';

// ─── Category icon map ─────────────────────────────────────────────────
export const CATEGORY_ICONS = {
  'Electronics':   { emoji: '🎧', bg: 'bg-slate-800', text: 'text-white' },
  'Clothing':      { emoji: '👕', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'Documents':     { emoji: '📄', bg: 'bg-amber-50',  text: 'text-amber-700' },
  'Food & Pantry': { emoji: '🍱', bg: 'bg-orange-100', text: 'text-orange-700' },
  'Gifts & Toys':  { emoji: '🎁', bg: 'bg-pink-100',  text: 'text-pink-700' },
  'Personal Care': { emoji: '🧴', bg: 'bg-teal-100',  text: 'text-teal-700' },
  'Fragile Goods': { emoji: '🫧', bg: 'bg-sky-50',    text: 'text-sky-700' },
  'Other':         { emoji: '📦', bg: 'bg-slate-100', text: 'text-slate-600' },
};

// ─── Name keyword icon map ─────────────────────────────────────────────
const NAME_KEYWORD_ICONS = [
  { keywords: ['headphone', 'earphone', 'airpod', 'earbud'], emoji: '🎧', bg: 'bg-slate-800', text: 'text-white' },
  { keywords: ['phone', 'iphone', 'samsung', 'mobile', 'smartphone'], emoji: '📱', bg: 'bg-slate-700', text: 'text-white' },
  { keywords: ['laptop', 'macbook', 'notebook', 'computer'], emoji: '💻', bg: 'bg-slate-800', text: 'text-white' },
  { keywords: ['tablet', 'ipad'], emoji: '📟', bg: 'bg-slate-700', text: 'text-white' },
  { keywords: ['watch', 'smartwatch'], emoji: '⌚', bg: 'bg-slate-800', text: 'text-white' },
  { keywords: ['cable', 'charger', 'usb', 'wire'], emoji: '🔌', bg: 'bg-green-100', text: 'text-green-800' },
  { keywords: ['camera', 'dslr'], emoji: '📷', bg: 'bg-slate-700', text: 'text-white' },
  { keywords: ['speaker', 'bluetooth'], emoji: '🔊', bg: 'bg-purple-100', text: 'text-purple-800' },
  { keywords: ['keyboard', 'mouse'], emoji: '⌨️', bg: 'bg-slate-200', text: 'text-slate-800' },
  { keywords: ['tv', 'monitor', 'screen', 'display'], emoji: '🖥️', bg: 'bg-slate-800', text: 'text-white' },
  { keywords: ['powerbank', 'power bank', 'battery'], emoji: '🔋', bg: 'bg-green-800', text: 'text-white' },
  { keywords: ['shirt', 'tshirt', 't-shirt', 'top', 'blouse'], emoji: '👕', bg: 'bg-blue-100', text: 'text-blue-800' },
  { keywords: ['pant', 'trouser', 'jeans', 'denim'], emoji: '👖', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { keywords: ['shoe', 'sneaker', 'boot', 'sandal', 'footwear'], emoji: '👟', bg: 'bg-amber-100', text: 'text-amber-800' },
  { keywords: ['jacket', 'coat', 'hoodie', 'sweater'], emoji: '🧥', bg: 'bg-slate-200', text: 'text-slate-800' },
  { keywords: ['dress'], emoji: '👗', bg: 'bg-pink-100', text: 'text-pink-800' },
  { keywords: ['cap', 'hat', 'helmet'], emoji: '🧢', bg: 'bg-red-100', text: 'text-red-800' },
  { keywords: ['bag', 'backpack', 'purse', 'wallet'], emoji: '👜', bg: 'bg-orange-100', text: 'text-orange-800' },
  { keywords: ['sunglasses', 'glasses', 'spectacles'], emoji: '🕶️', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { keywords: ['snack', 'chips', 'biscuit', 'cookie'], emoji: '🍪', bg: 'bg-amber-50', text: 'text-amber-800' },
  { keywords: ['chocolate', 'candy', 'sweet'], emoji: '🍫', bg: 'bg-amber-900', text: 'text-white' },
  { keywords: ['drink', 'juice', 'beverage', 'water', 'bottle'], emoji: '🍶', bg: 'bg-sky-100', text: 'text-sky-800' },
  { keywords: ['gift', 'present', 'box'], emoji: '🎁', bg: 'bg-pink-100', text: 'text-pink-800' },
  { keywords: ['toy', 'lego', 'doll', 'game', 'puzzle'], emoji: '🧸', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { keywords: ['book', 'novel', 'textbook'], emoji: '📚', bg: 'bg-amber-100', text: 'text-amber-800' },
  { keywords: ['document', 'paper', 'certificate', 'letter', 'envelope', 'passport'], emoji: '📄', bg: 'bg-amber-50', text: 'text-amber-800' },
  { keywords: ['medicine', 'capsule', 'drug', 'pharma'], emoji: '💊', bg: 'bg-red-50', text: 'text-red-700' },
  { keywords: ['perfume', 'cologne', 'deo', 'deodorant'], emoji: '🧴', bg: 'bg-purple-100', text: 'text-purple-700' },
  { keywords: ['lipstick', 'makeup', 'cosmetic', 'cream', 'lotion'], emoji: '💄', bg: 'bg-pink-100', text: 'text-pink-700' },
  { keywords: ['mug', 'cup', 'tumbler'], emoji: '☕', bg: 'bg-amber-100', text: 'text-amber-800' },
  { keywords: ['plate', 'bowl', 'utensil', 'spoon', 'fork', 'knife'], emoji: '🍽️', bg: 'bg-slate-100', text: 'text-slate-700' },
  { keywords: ['ball', 'cricket', 'football', 'basketball'], emoji: '⚽', bg: 'bg-green-100', text: 'text-green-800' },
  { keywords: ['yoga', 'mat', 'gym', 'dumbbell', 'fitness'], emoji: '🏋️', bg: 'bg-blue-100', text: 'text-blue-800' },
  { keywords: ['pen', 'pencil', 'stationery'], emoji: '✏️', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { keywords: ['glass', 'mirror', 'fragile', 'ceramic', 'vase'], emoji: '🫧', bg: 'bg-sky-50', text: 'text-sky-700' },
];

/**
 * Returns the best icon { emoji, bg, text } for an item name + category.
 */
export function getAutoIcon(name, category) {
  const lower = ((name || '') + ' ' + (category || '')).toLowerCase();
  for (const entry of NAME_KEYWORD_ICONS) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry;
  }
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  return { emoji: '📦', bg: 'bg-slate-100', text: 'text-white' };
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-base rounded-lg',
  md: 'w-10 h-10 text-xl rounded-lg',
  lg: 'w-14 h-14 text-2xl rounded-xl',
  xl: 'w-20 h-20 text-4xl rounded-2xl',
};

/**
 * ItemImage — renders uploaded photo if available, otherwise auto-detected emoji icon.
 * Written with React.createElement (no JSX) so this file can be .js.
 */
export function ItemImage({ item, size, className }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const extra = className || '';

  if (item && item.imageUrl) {
    return React.createElement('img', {
      src: item.imageUrl,
      alt: item.name || 'Item',
      className: sizeClass + ' object-cover border border-slate-200 flex-shrink-0 ' + extra,
    });
  }

  const icon = getAutoIcon(item && item.name, item && item.category);
  return React.createElement(
    'div',
    { className: sizeClass + ' ' + icon.bg + ' flex items-center justify-center flex-shrink-0 ' + extra },
    React.createElement('span', { className: icon.text }, icon.emoji)
  );
}
