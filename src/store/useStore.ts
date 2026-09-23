// ============================================
// 全局状态管理（Zustand）+ 本地存储持久化
// ============================================
import { create } from 'zustand';
import type { Baby, GrowthRecord, RecordItem, RecordType } from '@/types';
import { AVATAR_COLORS } from '@/constants/recordTypes';
import {
  STORAGE_KEYS,
  genId,
  getStorage,
  setStorage,
  removeStorage
} from '@/utils/storage';

interface StoreState {
  // ===== data =====
  babies: Baby[];
  currentBabyId: string;
  records: RecordItem[];
  /** 夜间模式 */
  dark: boolean;
  /** 生长测量记录（全量，按 babyId 过滤使用） */
  growthRecords: GrowthRecord[];

  // ===== baby actions =====
  addBaby: (data: Omit<Baby, 'id' | 'avatarColor' | 'createdAt'>) => void;
  updateBaby: (id: string, data: Partial<Omit<Baby, 'id' | 'createdAt'>>) => void;
  deleteBaby: (id: string) => void;
  switchBaby: (id: string) => void;

  // ===== record actions =====
  addRecord: (data: {
    type: RecordType;
    customName?: string;
    value?: number;
    unit?: string;
    side?: 'left' | 'right';
    startTime: number;
    endTime?: number;
    note?: string;
  }) => void;
  completeTiming: (
    recordId: string,
    endTime: number,
    patch?: Partial<Pick<RecordItem, 'value' | 'unit' | 'note' | 'quality'>>
  ) => void;
  deleteRecord: (id: string) => void;

  // ===== theme =====
  toggleDark: () => void;

  // ===== growth actions =====
  addGrowth: (data: {
    date: string;
    height?: number;
    weight?: number;
    headCirc?: number;
  }) => void;
  deleteGrowth: (id: string) => void;

  // ===== init =====
  hydrate: () => void;
}

/** 持久化 babies */
function persistBabies(babies: Baby[]) {
  setStorage(STORAGE_KEYS.BABIES, babies);
}
function persistCurrentBaby(id: string) {
  setStorage(STORAGE_KEYS.CURRENT_BABY_ID, id);
}
function persistRecords(records: RecordItem[]) {
  setStorage(STORAGE_KEYS.RECORDS, records);
}

/** 默认初始化一个宝宝 */
function ensureDefaultBaby(): Baby {
  const defaultBaby: Baby = {
    id: genId('b'),
    name: '宝宝',
    gender: 'male',
    birthDate: new Date().toISOString().slice(0, 10),
    avatarColor: AVATAR_COLORS[0],
    createdAt: Date.now()
  };
  persistBabies([defaultBaby]);
  persistCurrentBaby(defaultBaby.id);
  return defaultBaby;
}

export const useStore = create<StoreState>((set, get) => ({
  babies: [],
  currentBabyId: '',
  records: [],
  dark: false,
  growthRecords: [],

  addBaby: (data) => {
    const baby: Baby = {
      ...data,
      id: genId('b'),
      avatarColor: AVATAR_COLORS[get().babies.length % AVATAR_COLORS.length],
      createdAt: Date.now()
    };
    const babies = [...get().babies, baby];
    persistBabies(babies);
    set({ babies });
  },

  updateBaby: (id, data) => {
    const babies = get().babies.map((b) => (b.id === id ? { ...b, ...data } : b));
    persistBabies(babies);
    set({ babies });
  },

  deleteBaby: (id) => {
    const remaining = get().babies.filter((b) => b.id !== id);
    const records = get().records.filter((r) => r.babyId !== id);
    let currentBabyId = get().currentBabyId;
    if (currentBabyId === id) {
      currentBabyId = remaining[0]?.id ?? '';
    }
    persistBabies(remaining);
    persistRecords(records);
    if (remaining.length === 0) {
      removeStorage(STORAGE_KEYS.CURRENT_BABY_ID);
    } else {
      persistCurrentBaby(currentBabyId);
    }
    set({ babies: remaining, records, currentBabyId });
  },

  switchBaby: (id) => {
    persistCurrentBaby(id);
    set({ currentBabyId: id });
  },

  addRecord: ({ type, customName, value, unit, side, startTime, endTime, note }) => {
    const currentBabyId = get().currentBabyId;
    if (!currentBabyId) {
      console.error('[Store] addRecord: no current baby');
      return;
    }
    const record: RecordItem = {
      id: genId('r'),
      babyId: currentBabyId,
      type,
      customName,
      value,
      unit,
      side,
      startTime,
      endTime,
      note,
      createdAt: Date.now()
    };
    const records = [record, ...get().records];
    persistRecords(records);
    set({ records });
  },

  completeTiming: (recordId, endTime, patch) => {
    const records = get().records.map((r) =>
      r.id === recordId ? { ...r, endTime, ...patch } : r
    );
    persistRecords(records);
    set({ records });
  },

  deleteRecord: (id) => {
    const records = get().records.filter((r) => r.id !== id);
    persistRecords(records);
    set({ records });
  },

  toggleDark: () => {
    const dark = !get().dark;
    setStorage(STORAGE_KEYS.DARK, dark);
    set({ dark });
  },

  addGrowth: ({ date, height, weight, headCirc }) => {
    const currentBabyId = get().currentBabyId;
    if (!currentBabyId) return;
    const record: GrowthRecord = {
      id: genId('g'),
      babyId: currentBabyId,
      date,
      height,
      weight,
      headCirc,
      createdAt: Date.now()
    };
    const growthRecords = [...get().growthRecords, record].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    setStorage(STORAGE_KEYS.GROWTH, growthRecords);
    set({ growthRecords });
  },

  deleteGrowth: (id) => {
    const growthRecords = get().growthRecords.filter((g) => g.id !== id);
    setStorage(STORAGE_KEYS.GROWTH, growthRecords);
    set({ growthRecords });
  },

  hydrate: () => {
    const babies = getStorage<Baby[]>(STORAGE_KEYS.BABIES, []);
    let currentBabyId = getStorage<string>(STORAGE_KEYS.CURRENT_BABY_ID, '');
    if (babies.length === 0) {
      const baby = ensureDefaultBaby();
      set({ babies: [baby], currentBabyId: baby.id, records: [] });
      return;
    }
    if (!babies.find((b) => b.id === currentBabyId)) {
      currentBabyId = babies[0].id;
      persistCurrentBaby(currentBabyId);
    }
    const records = getStorage<RecordItem[]>(STORAGE_KEYS.RECORDS, []);
    const dark = getStorage<boolean>(STORAGE_KEYS.DARK, false);
    const growthRecords = getStorage<GrowthRecord[]>(STORAGE_KEYS.GROWTH, []);
    set({ babies, currentBabyId, records, dark, growthRecords });
  }
}));
