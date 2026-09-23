// ============================================
// 输入弹窗（数值 / 文本输入）
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface InputDialogProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  /** 输入类型 number | text */
  inputType?: 'number' | 'text';
  unit?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

const InputDialog: React.FC<InputDialogProps> = ({
  visible,
  title,
  placeholder,
  inputType = 'text',
  unit,
  confirmText = '确定',
  onCancel,
  onConfirm
}) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue('');
    }
  }, [visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    onConfirm(value);
  };

  return (
    <View className={styles.mask} onClick={onCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>{title}</Text>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            type={inputType === 'number' ? 'digit' : 'text'}
            value={value}
            placeholder={placeholder}
            placeholderClass={styles.placeholder}
            focus={visible}
            onInput={(e) => setValue(e.detail.value)}
          />
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        <View className={styles.actions}>
          <Button
            className={classnames(styles.btn, styles.btnCancel)}
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            className={classnames(styles.btn, styles.btnConfirm)}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default InputDialog;
