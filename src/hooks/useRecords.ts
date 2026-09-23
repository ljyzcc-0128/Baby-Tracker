// ============================================
// 记录相关 Hooks
// ============================================
import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { TIMING_TYPES } from '@/constants/recordTypes';
import type { RecordItem, RecordType } from '@/types';
import { startOfToday } from '@/utils/time';

/** 取当前宝宝的记录 */
export function useCurrentRecords(): RecordItem[] {
  const records = useStore((s) => s.records);
  const currentBabyId = useStore((s) => s.currentBabyId);
  return useMemo(
    () => records.filter((r) => r.babyId === currentBabyId),
    [records, currentBabyId]
  );
}

/** 取今日记录（按时间倒序） */
export function useTodayRecords(): RecordItem[] {
  const records = useCurrentRecords();
  return useMemo(() => {
    const start = startOfToday();
    return records
      .filter((r) => r.startTime >= start)
      .sort((a, b) => b.startTime - a.startTime);
  }, [records]);
}

/**
 * 取每种类型"距上次"的时间映射
 * @returns Record<RecordType, number> 每种类型最近一次记录的时间戳
 */
export function useLastRecordMap(): Record<string, number> {
  const records = useCurrentRecords();
  return useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      // 自定义类型按 customName 区分
      const key = r.type === 'custom' ? `custom_${r.customName}` : r.type;
      const t = r.endTime ?? r.startTime;
      if (!map[key] || t > map[key]) {
        map[key] = t;
      }
    }
    return map;
  }, [records]);
}

/** 取进行中的计时记录（任意计时类型且无 endTime），同一时刻只允许一个 */
export function useActiveTiming(): RecordItem | undefined {
  const records = useCurrentRecords();
  return useMemo(
    () => records.find((r) => TIMING_TYPES.includes(r.type) && !r.endTime),
    [records]
  );
}

/** 近 N 天按天按类型的计数 */
export function useDailyTypeCounts(days: number) {
  const records = useCurrentRecords();
  return useMemo(() => {
    const result: { date: string; counts: Record<string, number>; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86400000;
      const dayRecords = records.filter((r) => {
        const t = r.endTime ?? r.startTime;
        return t >= start && t < end;
      });
      const counts: Record<string, number> = {};
      let total = 0;
      for (const r of dayRecords) {
        const key = r.type;
        counts[key] = (counts[key] || 0) + 1;
        total++;
      }
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      result.push({ date: dateStr, counts, total });
    }
    return result;
  }, [records, days]);
}

/** 取指定类型在近 N 天每天的计数 */
export function useTypeDailyCounts(type: RecordType | 'all', days: number) {
  const daily = useDailyTypeCounts(days);
  return useMemo(() => {
    return daily.map((d) => ({
      date: d.date,
      count: type === 'all' ? d.total : d.counts[type] || 0
    }));
  }, [daily, type]);
}
