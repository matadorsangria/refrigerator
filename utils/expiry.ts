import { Ingredient } from '../types';

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok' | 'none';

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getExpiryStatus(expiresAt?: string): ExpiryStatus {
  if (!expiresAt) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseLocalDate(expiresAt);
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 2) return 'critical';
  if (diffDays <= 7) return 'warning';
  return 'ok';
}

export function formatExpiry(expiresAt?: string): string {
  if (!expiresAt) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseLocalDate(expiresAt);
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return '期限切れ';
  if (diffDays === 0) return '今日まで';
  if (diffDays === 1) return '明日まで';
  if (diffDays <= 7) return `あと${diffDays}日`;
  if (expiry.getFullYear() !== today.getFullYear()) {
    return `${expiry.getFullYear()}/${expiry.getMonth() + 1}/${expiry.getDate()}`;
  }
  return `${expiry.getMonth() + 1}/${expiry.getDate()}`;
}

export function statusColor(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':  return '#E74C3C';
    case 'critical': return '#E67E22';
    case 'warning':  return '#F1C40F';
    case 'ok':       return '#95A5A6';
    case 'none':     return '#BDC3C7';
  }
}

export function resolveExpiry(item: { expiresAt?: string; purchasedAt?: string; storageDays?: number }): string | undefined {
  if (item.expiresAt) return item.expiresAt;
  if (item.purchasedAt != null && item.storageDays != null) {
    const d = parseLocalDate(item.purchasedAt);
    d.setDate(d.getDate() + item.storageDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return undefined;
}

function effectiveExpiry(item: Ingredient): number | null {
  const s = resolveExpiry(item);
  return s ? new Date(s).getTime() : null;
}

export function sortByExpiry(items: Ingredient[]): Ingredient[] {
  return [...items].sort((a, b) => {
    const ea = effectiveExpiry(a);
    const eb = effectiveExpiry(b);
    if (ea === null && eb === null) return 0;
    if (ea === null) return 1;
    if (eb === null) return -1;
    return ea - eb;
  });
}
