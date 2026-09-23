/**
 * 国家免疫规划疫苗时间表（2021 版，免费接种）
 * months: 应接种月龄（0 = 出生时）
 */
export interface VaccineDose {
  id: string
  vaccine: string
  doseLabel: string
  months: number
  note?: string
}

export const VACCINE_SCHEDULE: VaccineDose[] = [
  { id: 'hepb-1', vaccine: '乙肝疫苗', doseLabel: '第1剂', months: 0, note: '出生 24 小时内' },
  { id: 'bcg-1', vaccine: '卡介苗', doseLabel: '第1剂', months: 0, note: '出生时' },
  { id: 'hepb-2', vaccine: '乙肝疫苗', doseLabel: '第2剂', months: 1 },
  { id: 'ipv-1', vaccine: '脊灰疫苗', doseLabel: '第1剂 (IPV)', months: 2 },
  { id: 'dtp-1', vaccine: '百白破疫苗', doseLabel: '第1剂', months: 3 },
  { id: 'ipv-2', vaccine: '脊灰疫苗', doseLabel: '第2剂 (IPV)', months: 3 },
  { id: 'dtp-2', vaccine: '百白破疫苗', doseLabel: '第2剂', months: 4 },
  { id: 'opv-3', vaccine: '脊灰疫苗', doseLabel: '第3剂 (bOPV)', months: 4 },
  { id: 'mps-a-1', vaccine: 'A群流脑多糖疫苗', doseLabel: '第1剂', months: 6, note: '与第2剂间隔≥3个月' },
  { id: 'je-1', vaccine: '乙脑减毒活疫苗', doseLabel: '第1剂', months: 8 },
  { id: 'mmr-1', vaccine: '麻腮风疫苗', doseLabel: '第1剂', months: 8 },
  { id: 'mps-a-2', vaccine: 'A群流脑多糖疫苗', doseLabel: '第2剂', months: 9 },
  { id: 'dtp-4', vaccine: '百白破疫苗', doseLabel: '第4剂', months: 18 },
  { id: 'mmr-2', vaccine: '麻腮风疫苗', doseLabel: '第2剂', months: 18 },
  { id: 'hep-a-1', vaccine: '甲肝减毒活疫苗', doseLabel: '第1剂', months: 18 },
  { id: 'je-2', vaccine: '乙脑减毒活疫苗', doseLabel: '第2剂', months: 24 },
  { id: 'mpv-ac-1', vaccine: 'A+C群流脑多糖疫苗', doseLabel: '第1剂', months: 36 },
  { id: 'opv-4', vaccine: '脊灰疫苗', doseLabel: '第4剂 (bOPV)', months: 48 },
  { id: 'dt-1', vaccine: '白破疫苗', doseLabel: '加强1剂', months: 72 },
  { id: 'mpv-ac-2', vaccine: 'A+C群流脑多糖疫苗', doseLabel: '第2剂', months: 72 },
]

/** 月龄显示文案 */
export function formatMonthAge(months: number): string {
  if (months === 0) return '出生时'
  if (months < 36) return `${months} 月龄`
  return `${months / 12} 周岁`
}

export interface VaccineRow extends VaccineDose {
  /** due date ISO (YYYY-MM-DD) */
  dueDate: string
  /** done | overdue | upcoming */
  status: 'done' | 'overdue' | 'upcoming'
  /** 距应接种日期天数，负数表示已逾期 */
  daysLeft: number
}
