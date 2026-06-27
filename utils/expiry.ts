import { Ingredient } from '../types';

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'ok' | 'none';

export function getExpiryStatus(expiresAt?: string): ExpiryStatus {
  if (!expiresAt) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 2) return 'critical';
  if (diffDays <= 7) return 'warning';
  return 'ok';
}

export function formatExpiry(expiresAt?: string): string {
  if (!expiresAt) return '-';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
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

export function sortByExpiry(items: Ingredient[]): Ingredient[] {
  return [...items].sort((a, b) => {
    if (!a.expiresAt && !b.expiresAt) return 0;
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });
}
