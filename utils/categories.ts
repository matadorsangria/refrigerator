import { Ingredient } from '../types';
import { sortByExpiry } from './expiry';

export const CATEGORY_ORDER = ['惣菜・弁当', '肉・魚・卵', '大豆製品', '乳製品', '卵', '野菜', '果物', 'パン・ご飯・麺', 'スイーツ', '飲料', '冷凍食品', '缶詰・瓶詰', '乾物・粉類', '調味料', 'お菓子', 'その他'];

export function groupByCategory(ingredients: Ingredient[]): { title: string; data: Ingredient[] }[] {
  const map: Record<string, Ingredient[]> = {};
  for (const ing of ingredients) {
    const cat = ing.category ?? 'その他';
    if (!map[cat]) map[cat] = [];
    map[cat].push(ing);
  }
  return CATEGORY_ORDER
    .filter(cat => map[cat]?.length > 0)
    .map(cat => ({ title: cat, data: sortByExpiry(map[cat]) }));
}
