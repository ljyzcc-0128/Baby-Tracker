// ============================================
// 宝宝头像：有照片显示照片，否则显示首字母+背景色
// ============================================
import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { Baby } from '@/types';
import styles from './index.module.scss';

interface BabyAvatarProps {
  baby?: Baby | null;
  /** 尺寸（rpx） */
  size?: number;
}

const BabyAvatar: React.FC<BabyAvatarProps> = ({ baby, size = 88 }) => {
  const boxStyle = { width: `${size}rpx`, height: `${size}rpx` };
  const fontSize = Math.round(size * 0.42);

  if (baby?.avatar) {
    return (
      <Image
        className={styles.avatar}
        style={boxStyle}
        src={baby.avatar}
        mode='aspectFill'
      />
    );
  }
  return (
    <View
      className={styles.avatar}
      style={{ ...boxStyle, backgroundColor: baby?.avatarColor || '#ff8c5a' }}
    >
      <Text className={styles.initial} style={{ fontSize: `${fontSize}rpx` }}>
        {baby?.name?.slice(0, 1) || '宝'}
      </Text>
    </View>
  );
};

export default BabyAvatar;
