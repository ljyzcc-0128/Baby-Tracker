// ============================================
// WHO 生长标准（0~36 月龄中位数 P50 简化表）
// 锚点月龄之间线性插值，超出范围返回 null
// ============================================
import type { Gender } from '@/types';

export type GrowthMetric = 'weight' | 'height' | 'head';

const ANCHOR_MONTHS = [0, 1, 2, 3, 4, 6, 9, 12, 18, 24, 36];

/** WHO P50 体重 kg */
const WEIGHT_P50: Record<Gender, number[]> = {
  //        0     1     2     3     4     6     9    12    18    24    36
  male:   [3.3,  4.5,  5.6,  6.4,  7.0,  7.9,  8.9,  9.6, 10.9, 12.2, 14.3],
  female: [3.2,  4.2,  5.1,  5.8,  6.4,  7.3,  8.2,  8.9, 10.2, 11.5, 13.9]
};

/** WHO P50 身高 cm */
const HEIGHT_P50: Record<Gender, number[]> = {
  male:   [49.9, 54.7, 58.4, 61.4, 63.9, 67.6, 72.0, 75.7, 82.3, 87.8, 95.4],
  female: [49.1, 53.7, 57.1, 59.8, 62.1, 65.7, 70.1, 74.0, 80.7, 86.4, 94.2]
};

/** WHO P50 头围 cm */
const HEAD_P50: Record<Gender, number[]> = {
  male:   [34.5, 37.3, 39.5, 41.0, 42.2, 43.9, 45.5, 46.5, 47.9, 48.9, 50.3],
  female: [33.9, 36.5, 38.6, 40.0, 41.1, 42.8, 44.4, 45.4, 46.7, 47.7, 49.1]
};

/** 取指定月龄的 WHO P50 参考值（线性插值） */
export function whoP50(
  gender: Gender,
  metric: GrowthMetric,
  month: number
): number | null {
  if (month < 0 || month > 36) return null;
  const table =
    metric === 'weight' ? WEIGHT_P50 : metric === 'height' ? HEIGHT_P50 : HEAD_P50;
  const values = table[gender];

  // 找到所在区间
  for (let i = 0; i < ANCHOR_MONTHS.length - 1; i++) {
    const m0 = ANCHOR_MONTHS[i];
    const m1 = ANCHOR_MONTHS[i + 1];
    if (month >= m0 && month <= m1) {
      const v0 = values[i];
      const v1 = values[i + 1];
      if (m1 === m0) return v0;
      return v0 + ((v1 - v0) * (month - m0)) / (m1 - m0);
    }
  }
  return null;
}

/** 生成 0~36 月逐月参考曲线点 */
export function whoP50Curve(
  gender: Gender,
  metric: GrowthMetric
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let m = 0; m <= 36; m++) {
    const v = whoP50(gender, metric, m);
    if (v !== null) points.push({ x: m, y: Number(v.toFixed(1)) });
  }
  return points;
}

/** METRIC 显示配置 */
export const GROWTH_METRICS: {
  key: GrowthMetric;
  label: string;
  unit: string;
  icon: string;
  decimals: number;
}[] = [
  { key: 'weight', label: '体重', unit: 'kg', icon: '⚖️', decimals: 1 },
  { key: 'height', label: '身高', unit: 'cm', icon: '📏', decimals: 1 },
  { key: 'head', label: '头围', unit: 'cm', icon: '🧸', decimals: 1 }
];
