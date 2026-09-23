// ============================================
// 宝宝喂养记录 - 类型定义
// ============================================

/** 记录类型枚举 */
export type RecordType =
  | 'pee' // 小便
  | 'poop' // 大便
  | 'breast' // 母乳
  | 'bottle' // 奶瓶
  | 'water' // 喂水
  | 'vitaminAD' // 喂AD
  | 'vitaminD3' // 喂D3
  | 'food' // 辅食
  | 'sleep' // 睡眠
  | 'bath' // 洗澡
  | 'temperature' // 体温
  | 'diaper' // 换尿布
  | 'medicine' // 用药
  | 'custom'; // 自定义

/** 输入类型 */
export type InputKind = 'none' | 'number' | 'text';

/** 单条记录 */
export interface RecordItem {
  /** 唯一 id */
  id: string;
  /** 所属宝宝 id */
  babyId: string;
  /** 记录类型 */
  type: RecordType;
  /** 自定义类型名称（type === 'custom' 时有效） */
  customName?: string;
  /** 数值（奶瓶毫升数 / 体温度数 / 辅食量等） */
  value?: number;
  /** 值的单位 */
  unit?: string;
  /** 哺乳侧别（type === 'breast' 时有效） */
  side?: 'left' | 'right';
  /** 睡眠质量（type === 'sleep' 时有效）：安稳/一般/频繁醒 */
  quality?: SleepQuality;
  /** 开始时间戳（ms） */
  startTime: number;
  /** 结束时间戳（ms），用于睡眠等需计时的事件 */
  endTime?: number;
  /** 备注 */
  note?: string;
  /** 创建时间戳（ms） */
  createdAt: number;
}

/** 宝宝性别 */
export type Gender = 'male' | 'female';

/** 睡眠质量 */
export type SleepQuality = 'good' | 'ok' | 'restless';

/** 生长测量记录 */
export interface GrowthRecord {
  /** 唯一 id */
  id: string;
  /** 所属宝宝 id */
  babyId: string;
  /** 测量日期 YYYY-MM-DD */
  date: string;
  /** 身高 cm */
  height?: number;
  /** 体重 kg */
  weight?: number;
  /** 头围 cm */
  headCirc?: number;
  /** 创建时间戳（ms） */
  createdAt: number;
}

/** 宝宝信息 */
export interface Baby {
  /** 唯一 id */
  id: string;
  /** 昵称 */
  name: string;
  /** 性别 */
  gender: Gender;
  /** 出生日期 YYYY-MM-DD */
  birthDate: string;
  /** 头像背景色 */
  avatarColor: string;
  /** 创建时间戳（ms） */
  createdAt: number;
}
