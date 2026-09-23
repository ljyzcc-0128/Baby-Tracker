// ============================================
// 柱状图组件（近7天各类型记录次数）
// ============================================
import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import type { RecordType } from '@/types';
import { RECORD_TYPES, RECORD_TYPE_MAP } from '@/constants/recordTypes';
import styles from './index.module.scss';

interface BarChartProps {
  /** 近 N 天数据 */
  data: { date: string; counts: Record<string, number>; total: number }[];
  /** 选中类型（'all' 表示全部，按类型堆叠） */
  selectedType: RecordType | 'all';
}

const BarChart: React.FC<BarChartProps> = ({ data, selectedType }) => {
  // 计算最大值用于柱高比例
  const maxTotal = Math.max(
    1,
    ...data.map((d) => {
      if (selectedType === 'all') return d.total;
      return d.counts[selectedType] || 0;
    })
  );

  // 图例展示的类型
  const legendTypes =
    selectedType === 'all'
      ? RECORD_TYPES.filter((t) =>
          data.some((d) => (d.counts[t.type] || 0) > 0)
        )
      : [RECORD_TYPE_MAP[selectedType]];

  return (
    <View className={styles.chart}>
      <View className={styles.bars}>
        {data.map((day) => {
          const height = Math.round(
            ((selectedType === 'all' ? day.total : day.counts[selectedType] || 0) /
              maxTotal) *
              100
          );
          return (
            <View key={day.date} className={styles.barCol}>
              <View className={styles.barWrap}>
                <View
                  className={styles.barInner}
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  {selectedType === 'all' ? (
                    <View className={styles.stack}>
                      {RECORD_TYPES.map((t) => {
                        const c = day.counts[t.type] || 0;
                        if (c === 0) return null;
                        const segHeight = Math.round((c / day.total) * 100);
                        return (
                          <View
                            key={t.type}
                            className={styles.segment}
                            style={{
                              backgroundColor: t.color,
                              flex: `${segHeight}`
                            }}
                          />
                        );
                      })}
                    </View>
                  ) : (
                    <View
                      className={styles.singleBar}
                      style={{ backgroundColor: RECORD_TYPE_MAP[selectedType].color }}
                    />
                  )}
                </View>
                <Text className={styles.count}>
                  {selectedType === 'all'
                    ? day.total
                    : day.counts[selectedType] || 0}
                </Text>
              </View>
              <Text className={styles.dateLabel}>{day.date}</Text>
            </View>
          );
        })}
      </View>

      {legendTypes.length > 0 && (
        <View className={styles.legend}>
          <ScrollView scrollX className={styles.legendScroll} enhanced showScrollbar={false}>
            {legendTypes.map((t) => (
              <View key={t.type} className={styles.legendItem}>
                <View
                  className={styles.legendDot}
                  style={{ backgroundColor: t.color }}
                />
                <Text className={styles.legendText}>{t.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default BarChart;
