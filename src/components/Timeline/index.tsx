// ============================================
// 今日时间轴（长按可删除）
// ============================================
import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { RecordItem } from '@/types';
import { RECORD_TYPE_MAP, SLEEP_QUALITY, isTimingType } from '@/constants/recordTypes';
import { formatTimelineTime, formatDuration } from '@/utils/time';
import styles from './index.module.scss';

interface TimelineProps {
  records: RecordItem[];
  onDelete?: (id: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ records, onDelete }) => {
  const handleLongPress = (record: RecordItem) => {
    Taro.showModal({
      title: '删除记录',
      content: `确定删除「${getRecordLabel(record)}」这条记录吗？`,
      confirmText: '删除',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm && onDelete) {
          onDelete(record.id);
        }
      }
    });
  };

  if (records.length === 0) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyIcon}>📋</Text>
        <Text className={styles.emptyText}>今天还没有记录</Text>
        <Text className={styles.emptyHint}>点击上方按钮开始记录</Text>
      </View>
    );
  }

  return (
    <View className={styles.timeline}>
      {records.map((record, idx) => {
        const cfg = RECORD_TYPE_MAP[record.type];
        const name = getRecordLabel(record);
        const valueText = formatValue(record);
        const durationText =
          isTimingType(record.type) && record.endTime
            ? formatDuration(record.endTime - record.startTime)
            : '';
        const isLast = idx === records.length - 1;

        return (
          <View
            key={record.id}
            className={styles.item}
            onLongPress={() => handleLongPress(record)}
          >
            <View className={styles.left}>
              <View
                className={styles.dot}
                style={{ backgroundColor: cfg.color }}
              />
              {!isLast && <View className={styles.line} />}
            </View>
            <View className={styles.content}>
              <View className={styles.row}>
                <Text className={styles.time}>
                  {formatTimelineTime(record.startTime)}
                  {record.endTime
                    ? ` - ${formatTimelineTime(record.endTime)}`
                    : ''}
                </Text>
                {durationText && (
                  <Text className={styles.duration}>{durationText}</Text>
                )}
              </View>
              <View className={styles.info}>
                <Text className={styles.icon}>{cfg.icon}</Text>
                <Text className={styles.name}>{name}</Text>
                {valueText && <Text className={styles.value}>{valueText}</Text>}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

function getRecordLabel(record: RecordItem): string {
  if (record.type === 'custom' && record.customName) {
    return record.customName;
  }
  return RECORD_TYPE_MAP[record.type].label;
}

function formatValue(record: RecordItem): string {
  if (record.type === 'breast' && record.side) {
    return record.side === 'left' ? '左侧' : '右侧';
  }
  if (record.type === 'sleep' && record.quality) {
    const q = SLEEP_QUALITY.find((s) => s.key === record.quality);
    return q ? `${q.icon} ${q.label}` : '';
  }
  if (record.value !== undefined && record.value !== null) {
    const base = `${record.value}${record.unit || ''}`;
    // 奶瓶实际摄入：附冲调/剩余明细
    return record.type === 'bottle' && record.note
      ? `${base}（${record.note}）`
      : base;
  }
  if (record.type === 'custom' && record.customName) {
    return record.customName;
  }
  if (record.note) {
    return record.note;
  }
  return '';
}

export default Timeline;
