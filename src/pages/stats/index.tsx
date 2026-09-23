// ============================================
// 统计页：近7天各类型记录次数柱状图 + 就诊摘要
// ============================================
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import {
  RECORD_TYPES,
  RECORD_TYPE_MAP,
  SLEEP_QUALITY
} from '@/constants/recordTypes';
import type { RecordType } from '@/types';
import { useDailyTypeCounts } from '@/hooks/useRecords';
import { useStore } from '@/store/useStore';
import { buildVisitSummary } from '@/utils/visitSummary';
import BarChart from '@/components/BarChart';
import BabySwitcher from '@/components/BabySwitcher';
import SummaryDialog from '@/components/SummaryDialog';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<RecordType | 'all'>('all');
  const dark = useStore((s) => s.dark);
  const babies = useStore((s) => s.babies);
  const currentBabyId = useStore((s) => s.currentBabyId);
  const records = useStore((s) => s.records);

  const [summaryDialog, setSummaryDialog] = useState({
    visible: false,
    content: ''
  });

  const daily = useDailyTypeCounts(7);

  // 汇总数据
  const summary = useMemo(() => {
    const total = daily.reduce((sum, d) => sum + d.total, 0);
    const avg = Math.round(total / 7);
    // 出现次数最多的类型
    const typeCount: Record<string, number> = {};
    daily.forEach((d) => {
      Object.entries(d.counts).forEach(([t, c]) => {
        typeCount[t] = (typeCount[t] || 0) + c;
      });
    });
    let topType: RecordType | null = null;
    let topCount = 0;
    Object.entries(typeCount).forEach(([t, c]) => {
      if (c > topCount) {
        topCount = c;
        topType = t as RecordType;
      }
    });
    return { total, avg, topType, topCount };
  }, [daily]);

  // 今日记录数
  const todayTotal = daily[daily.length - 1]?.total || 0;

  // 近 7 天睡眠质量占比
  const sleepStats = useMemo(() => {
    const start = dayjs().subtract(6, 'day').startOf('day').valueOf();
    const sleeps = records.filter(
      (r) =>
        r.babyId === currentBabyId &&
        r.type === 'sleep' &&
        r.endTime != null &&
        r.endTime >= start
    );
    const total = sleeps.length;
    const pct: Record<string, number> = {};
    SLEEP_QUALITY.forEach((q) => {
      const c = sleeps.filter((s) => s.quality === q.key).length;
      pct[q.key] = total ? Math.round((c / total) * 100) : 0;
    });
    return { total, pct };
  }, [records, currentBabyId]);

  // 有数据的类型列表（用于筛选）
  const activeTypes = useMemo(() => {
    const set = new Set<RecordType>();
    daily.forEach((d) =>
      Object.keys(d.counts).forEach((t) => set.add(t as RecordType))
    );
    return RECORD_TYPES.filter((t) => set.has(t.type));
  }, [daily]);

  /** 就诊摘要：选时间范围后生成 */
  const handleVisitSummary = () => {
    const baby = babies.find((b) => b.id === currentBabyId);
    if (!baby) return;
    Taro.showActionSheet({
      alertText: '选择摘要覆盖的时间范围',
      itemList: ['今天', '近 3 天', '近 7 天'],
      success: (res) => {
        const days = [1, 3, 7][res.tapIndex];
        const content = buildVisitSummary(
          records.filter((r) => r.babyId === currentBabyId),
          baby,
          days
        );
        setSummaryDialog({ visible: true, content });
      }
    });
  };

  return (
    <View className={classnames(styles.page, dark && 'theme-dark')}>
      <View className={styles.header}>
        <BabySwitcher />
      </View>

      <View className={styles.summary}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{todayTotal}</Text>
          <Text className={styles.summaryLabel}>今日记录</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{summary.total}</Text>
          <Text className={styles.summaryLabel}>近7天</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{summary.avg}</Text>
          <Text className={styles.summaryLabel}>日均</Text>
        </View>
      </View>

      <View className={styles.visitCard} onClick={handleVisitSummary}>
        <Text className={styles.visitIcon}>🩺</Text>
        <View className={styles.visitInfo}>
          <Text className={styles.visitTitle}>就诊摘要</Text>
          <Text className={styles.visitDesc}>
            喂养/排便/体温/用药汇总，一键复制给医生
          </Text>
        </View>
        <Text className={styles.visitArrow}>›</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>近 7 天记录趋势</Text>
        {summary.total > 0 ? (
          <BarChart data={daily} selectedType={selectedType} />
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>暂无记录数据</Text>
          </View>
        )}
      </View>

      {sleepStats.total > 0 && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>近 7 天睡眠质量</Text>
          <View className={styles.qualityRow}>
            {SLEEP_QUALITY.map((q) => (
              <View key={q.key} className={styles.qualityItem}>
                <Text className={styles.qualityValue}>
                  {sleepStats.pct[q.key]}%
                </Text>
                <Text className={styles.qualityLabel}>
                  {q.icon} {q.label}
                </Text>
              </View>
            ))}
          </View>
          <Text className={styles.subtitle}>
            共 {sleepStats.total} 次睡眠记录
          </Text>
        </View>
      )}

      {activeTypes.length > 0 && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>按类型筛选</Text>
          <ScrollView scrollX className={styles.filterScroll} enhanced showScrollbar={false}>
            <View
              className={classnames(
                styles.filterItem,
                selectedType === 'all' && styles.filterItemActive
              )}
              onClick={() => setSelectedType('all')}
            >
              全部
            </View>
            {activeTypes.map((t) => (
              <View
                key={t.type}
                className={classnames(
                  styles.filterItem,
                  selectedType === t.type && styles.filterItemActive
                )}
                onClick={() => setSelectedType(t.type)}
              >
                {t.icon} {t.label}
              </View>
            ))}
          </ScrollView>
          {(() => {
            const top = summary.topType as RecordType | null;
            if (!top) return null;
            const topCfg = RECORD_TYPE_MAP[top];
            return (
              <Text className={styles.subtitle}>
                最常记录：{topCfg.icon} {topCfg.label}（{summary.topCount} 次）
              </Text>
            );
          })()}
        </View>
      )}

      <SummaryDialog
        visible={summaryDialog.visible}
        title='就诊摘要'
        content={summaryDialog.content}
        onClose={() => setSummaryDialog({ visible: false, content: '' })}
      />
    </View>
  );
};

export default StatsPage;
