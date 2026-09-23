// ============================================
// 记录按钮组件（单种类型）
// ============================================
import React from 'react';
import { View, Text } from '@tarojs/components';
import type { RecordTypeConfig } from '@/constants/recordTypes';
import { formatTimeAgo } from '@/utils/time';
import styles from './index.module.scss';

interface RecordButtonProps {
  config: RecordTypeConfig;
  lastTime?: number;
  /** 是否处于计时中（睡眠） */
  timing?: boolean;
  onClick: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  config,
  lastTime,
  timing,
  onClick
}) => {
  return (
    <View
      className={styles.button}
      style={timing ? { boxShadow: `0 0 0 4rpx ${config.color}40` } : undefined}
      onClick={onClick}
    >
      <View
        className={styles.iconWrap}
        style={{ backgroundColor: `${config.color}26` }}
      >
        <Text className={styles.icon}>{config.icon}</Text>
      </View>
      <Text className={styles.label}>{config.label}</Text>
      <Text className={styles.ago}>
        {timing ? '计时中' : formatTimeAgo(lastTime || 0)}
      </Text>
    </View>
  );
};

export default RecordButton;
