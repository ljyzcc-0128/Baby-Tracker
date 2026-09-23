// ============================================
// 本地存储封装（基于 Taro.setStorageSync）
// ============================================
import Taro from '@tarojs/taro';

export const STORAGE_KEYS = {
  BABIES: 'bt_babies',
  CURRENT_BABY_ID: 'bt_current_baby_id',
  RECORDS: 'bt_records',
  DARK: 'bt_dark',
  GROWTH: 'bt_growth',
  VACCINE: 'bt_vaccine',
  SETTINGS: 'bt_settings'
} as const;

export function getStorage<T>(key: string, fallback: T): T {
  try {
    const value = Taro.getStorageSync(key);
    if (value === '' || value === null || value === undefined) {
      return fallback;
    }
    return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
  } catch (err) {
    console.error('[Storage] getStorage failed:', key, err);
    return fallback;
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (err) {
    console.error('[Storage] setStorage failed:', key, err);
  }
}

export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(key);
  } catch (err) {
    console.error('[Storage] removeStorage failed:', key, err);
  }
}

/** 生成唯一 id */
export function genId(prefix = 'r'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
