// ============================================
// 就诊摘要弹窗：展示结构化摘要文本，一键复制
// ============================================
import React from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface SummaryDialogProps {
  visible: boolean;
  title?: string;
  content: string;
  onClose: () => void;
}

const SummaryDialog: React.FC<SummaryDialogProps> = ({
  visible,
  title = '就诊摘要',
  content,
  onClose
}) => {
  if (!visible) return null;

  const handleCopy = () => {
    Taro.setClipboardData({
      data: content,
      success: () => {
        Taro.showToast({ title: '已复制，可粘贴给医生', icon: 'none' });
        onClose();
      }
    });
  };

  return (
    <View className={styles.mask} onClick={onClose}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>{title}</Text>
        <ScrollView className={styles.body} scrollY>
          <Text className={styles.content}>{content}</Text>
        </ScrollView>
        <View className={styles.actions}>
          <Button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>
            关闭
          </Button>
          <Button
            className={`${styles.btn} ${styles.btnConfirm}`}
            onClick={handleCopy}
          >
            复制摘要
          </Button>
        </View>
      </View>
    </View>
  );
};

export default SummaryDialog;
