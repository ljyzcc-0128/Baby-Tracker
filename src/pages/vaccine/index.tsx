// ============================================
// 疫苗接种页：国家免疫规划时间表 + 接种状态记录
// ============================================
import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import BabySwitcher from '@/components/BabySwitcher';
import {
  VACCINE_SCHEDULE,
  formatMonthAge
} from '@/constants/vaccineSchedule';
import type { VaccineRow } from '@/constants/vaccineSchedule';
import { formatAge } from '@/utils/time';
import styles from './index.module.scss';

const VaccinePage: React.FC = () => {
  const babies = useStore((s) => s.babies);
  const currentBabyId = useStore((s) => s.currentBabyId);
  const vaccineDone = useStore((s) => s.vaccineDone);
  const dark = useStore((s) => s.dark);

  useDidShow(() => {
    if (!currentBabyId && babies.length === 0) {
      useStore.getState().hydrate();
    }
  });

  const baby = babies.find((b) => b.id === currentBabyId);
  const doneIds = useMemo(
    () => vaccineDone[currentBabyId] ?? [],
    [vaccineDone, currentBabyId]
  );

  /** 全部剂次 + 状态计算 */
  const rows = useMemo<VaccineRow[]>(() => {
    if (!baby) return [];
    const birth = dayjs(baby.birthDate);
    const today = dayjs();
    return VACCINE_SCHEDULE.map((d) => {
      const due = birth.add(d.months, 'month');
      const dueDate = due.format('YYYY-MM-DD');
      const daysLeft = due.diff(today, 'day');
      return {
        ...d,
        dueDate,
        daysLeft,
        status: doneIds.includes(d.id)
          ? 'done'
          : daysLeft <= 0
            ? 'overdue'
            : 'upcoming'
      };
    });
  }, [baby, doneIds]);

  /** 下一针：最早一剂未完成的 */
  const nextDose = useMemo(
    () => rows.find((r) => r.status !== 'done'),
    [rows]
  );

  /** 按月龄分组 */
  const groups = useMemo(() => {
    const map = new Map<number, VaccineRow[]>();
    rows.forEach((r) => {
      const list = map.get(r.months) ?? [];
      list.push(r);
      map.set(r.months, list);
    });
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([months, list]) => ({ months, list }));
  }, [rows]);

  const overdueCount = rows.filter((r) => r.status === 'overdue').length;

  const handleToggle = (row: VaccineRow) => {
    if (!currentBabyId) return;
    const markDone = row.status !== 'done';
    const doToggle = () => {
      useStore.getState().toggleVaccine(currentBabyId, row.id);
      Taro.showToast({
        title: markDone ? '已记录接种 ✓' : '已取消记录',
        icon: 'none'
      });
    };
    if (markDone) {
      Taro.showModal({
        title: '确认接种',
        content: `「${row.vaccine} ${row.doseLabel}」已接种？`,
        confirmText: '已接种',
        success: (res) => {
          if (res.confirm) doToggle();
        }
      });
    } else {
      doToggle();
    }
  };

  const statusText = (r: VaccineRow) => {
    if (r.status === 'done') return '已接种';
    if (r.status === 'overdue')
      return r.daysLeft === 0 ? '今天该接种' : `已到时间 ${-r.daysLeft} 天`;
    if (r.daysLeft <= 30) return `还有 ${r.daysLeft} 天`;
    return `预计 ${r.dueDate.slice(5)}`;
  };

  return (
    <View className={classnames(styles.page, dark && 'theme-dark')}>
      <View className={styles.header}>
        <BabySwitcher />
        {baby && (
          <Text className={styles.ageText}>
            {baby.name} · 月龄 {formatAge(baby.birthDate)}
          </Text>
        )}
      </View>

      {/* 汇总 + 下一针 */}
      <View className={styles.card}>
        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum}>
              {doneIds.length}
              <Text className={styles.summaryTotal}>/{rows.length}</Text>
            </Text>
            <Text className={styles.summaryLabel}>已接种剂次</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text
              className={classnames(
                styles.summaryNum,
                overdueCount > 0 && styles.summaryAlert
              )}
            >
              {overdueCount}
            </Text>
            <Text className={styles.summaryLabel}>待补种剂次</Text>
          </View>
        </View>

        {nextDose && (
          <View
            className={classnames(
              styles.nextCard,
              nextDose.status === 'overdue' && styles.nextCardAlert
            )}
          >
            <Text className={styles.nextLabel}>
              {nextDose.status === 'overdue' ? '📌 该接种了' : '💉 下一针'}
            </Text>
            <Text className={styles.nextName}>
              {nextDose.vaccine} {nextDose.doseLabel}
            </Text>
            <Text className={styles.nextTime}>
              应接种：{nextDose.dueDate}（{formatMonthAge(nextDose.months)}）
              {nextDose.status === 'upcoming' && ` · 还有 ${nextDose.daysLeft} 天`}
            </Text>
          </View>
        )}
      </View>

      {/* 接种时间表 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          免疫规划时间表（点按记录接种）
        </Text>
        {groups.map((g) => (
          <View key={g.months} className={styles.group}>
            <Text className={styles.groupTitle}>
              {formatMonthAge(g.months)}
            </Text>
            {g.list.map((r) => (
              <View
                key={r.id}
                className={classnames(
                  styles.doseRow,
                  r.status === 'done' && styles.doseDone,
                  r.status === 'overdue' && styles.doseOverdue
                )}
                onClick={() => handleToggle(r)}
              >
                <View
                  className={classnames(
                    styles.check,
                    r.status === 'done' && styles.checkDone
                  )}
                >
                  {r.status === 'done' ? '✓' : ''}
                </View>
                <View className={styles.doseInfo}>
                  <Text className={styles.doseName}>
                    {r.vaccine} · {r.doseLabel}
                  </Text>
                  <Text className={styles.doseDue}>
                    {r.dueDate}
                    {r.note ? ` · ${r.note}` : ''}
                  </Text>
                </View>
                <Text
                  className={classnames(
                    styles.statusText,
                    r.status === 'done' && styles.statusDone,
                    r.status === 'overdue' && styles.statusOverdue
                  )}
                >
                  {statusText(r)}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <Text className={styles.footerNote}>
          以上为国家免疫规划（NIP）免费疫苗；非免疫规划疫苗（如五联、肺炎13价、手足口等）请遵医嘱自行安排。具体接种时间以社区接种点通知为准。
        </Text>
      </View>
    </View>
  );
};

export default VaccinePage;
