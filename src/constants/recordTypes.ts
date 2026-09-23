// ============================================
// 14 种记录类型配置
// ============================================
import type { InputKind, RecordType } from '@/types';

export interface RecordTypeConfig {
  type: RecordType;
  /** 显示名称 */
  label: string;
  /** emoji 图标 */
  icon: string;
  /** 主题色变量名（指向 theme.scss 的变量） */
  colorVar: string;
  /** 实际色值，用于内联样式 */
  color: string;
  /** 输入类型 */
  inputKind: InputKind;
  /** 输入框占位/提示 */
  inputPlaceholder?: string;
  /** 值的单位 */
  unit?: string;
  /** 是否需要计时（双击自动计时） */
  timing?: boolean;
}

export const RECORD_TYPES: RecordTypeConfig[] = [
  { type: 'pee', label: '小便', icon: '💧', colorVar: 'color-pee', color: '#ffd666', inputKind: 'none' },
  { type: 'poop', label: '大便', icon: '💩', colorVar: 'color-poop', color: '#a37a5c', inputKind: 'none' },
  { type: 'breast', label: '母乳', icon: '🤱', colorVar: 'color-breast', color: '#ff9dba', inputKind: 'none', timing: true },
  {
    type: 'bottle', label: '奶瓶', icon: '🍼', colorVar: 'color-bottle', color: '#5ba3ff',
    inputKind: 'number', inputPlaceholder: '输入毫升数', unit: 'ml', timing: true
  },
  { type: 'water', label: '喂水', icon: '🥤', colorVar: 'color-water', color: '#4fc4f1', inputKind: 'none' },
  { type: 'vitaminAD', label: '喂AD', icon: '💊', colorVar: 'color-vitad', color: '#4cd9a0', inputKind: 'none' },
  { type: 'vitaminD3', label: '喂D3', icon: '🟢', colorVar: 'color-vitad3', color: '#33d6c5', inputKind: 'none' },
  {
    type: 'food', label: '辅食', icon: '🍽', colorVar: 'color-food', color: '#ff9f40',
    inputKind: 'text', inputPlaceholder: '输入辅食内容'
  },
  { type: 'sleep', label: '睡眠', icon: '😴', colorVar: 'color-sleep', color: '#6c7bff', inputKind: 'none', timing: true },
  { type: 'bath', label: '洗澡', icon: '🛁', colorVar: 'color-bath', color: '#5bc0eb', inputKind: 'none' },
  {
    type: 'temperature', label: '体温', icon: '🌡', colorVar: 'color-temp', color: '#ff6b6b',
    inputKind: 'number', inputPlaceholder: '输入体温度数', unit: '°C'
  },
  { type: 'diaper', label: '换尿布', icon: '🧻', colorVar: 'color-diaper', color: '#ffb84c', inputKind: 'none' },
  { type: 'medicine', label: '用药', icon: '💉', colorVar: 'color-medicine', color: '#9b6dff', inputKind: 'text', inputPlaceholder: '输入药品名称' },
  { type: 'custom', label: '自定义', icon: '✏️', colorVar: 'color-custom', color: '#8a94a6', inputKind: 'text', inputPlaceholder: '输入事件名称' }
];

/** 按 type 取配置 */
export const RECORD_TYPE_MAP: Record<RecordType, RecordTypeConfig> = RECORD_TYPES.reduce(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<RecordType, RecordTypeConfig>
);

/** 需要计时的类型集合 */
export const TIMING_TYPES: RecordType[] = RECORD_TYPES
  .filter((t) => t.timing)
  .map((t) => t.type);

/** 判断某类型是否需要计时 */
export function isTimingType(type: RecordType): boolean {
  return TIMING_TYPES.includes(type);
}

/** 睡眠质量选项 */
export const SLEEP_QUALITY: {
  key: 'good' | 'ok' | 'restless';
  label: string;
  icon: string;
}[] = [
  { key: 'good', label: '安稳', icon: '😴' },
  { key: 'ok', label: '一般', icon: '😐' },
  { key: 'restless', label: '频繁醒', icon: '😵' }
];

/** 头像候选色 */
export const AVATAR_COLORS = [
  '#ff8c5a', '#5ba3ff', '#4cd9a0', '#ff9dba',
  '#9b6dff', '#ffb84c', '#5bc0eb', '#ff6b6b'
];
