// ============================================
// 宝宝快速切换组件
// ============================================
import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { formatAge } from '@/utils/time';
import styles from './index.module.scss';

const BabySwitcher: React.FC = () => {
  const babies = useStore((s) => s.babies);
  const currentBabyId = useStore((s) => s.currentBabyId);
  const switchBaby = useStore((s) => s.switchBaby);
  const [expanded, setExpanded] = useState(false);

  const current = babies.find((b) => b.id === currentBabyId);

  const handleSelect = (id: string) => {
    switchBaby(id);
    setExpanded(false);
  };

  return (
    <View className={styles.wrap}>
      <View
        className={styles.current}
        onClick={() => babies.length > 1 && setExpanded(!expanded)}
      >
        <View
          className={styles.avatar}
          style={{ backgroundColor: current?.avatarColor || '#ff8c5a' }}
        >
          <Text className={styles.avatarText}>
            {current?.name?.slice(0, 1) || '宝'}
          </Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{current?.name || '未选择'}</Text>
          <Text className={styles.age}>
            {current ? formatAge(current.birthDate) : ''}
          </Text>
        </View>
        {babies.length > 1 && (
          <Text className={classnames(styles.arrow, expanded && styles.arrowUp)}>
            ▼
          </Text>
        )}
      </View>

      {expanded && babies.length > 1 && (
        <ScrollView scrollY className={styles.list}>
          {babies.map((baby) => (
            <View
              key={baby.id}
              className={classnames(
                styles.item,
                baby.id === currentBabyId && styles.itemActive
              )}
              onClick={() => handleSelect(baby.id)}
            >
              <View
                className={styles.avatarSmall}
                style={{ backgroundColor: baby.avatarColor }}
              >
                <Text className={styles.avatarTextSmall}>
                  {baby.name.slice(0, 1)}
                </Text>
              </View>
              <View className={styles.itemInfo}>
                <Text className={styles.itemName}>{baby.name}</Text>
                <Text className={styles.itemAge}>{formatAge(baby.birthDate)}</Text>
              </View>
              {baby.id === currentBabyId && <Text className={styles.check}>✓</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default BabySwitcher;
