// ============================================
// 宝宝新增/编辑弹窗
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Text, Input, Button, Picker, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import type { Baby, Gender } from '@/types';
import { AVATAR_COLORS } from '@/constants/recordTypes';
import styles from './index.module.scss';

interface BabyEditDialogProps {
  visible: boolean;
  /** 编辑时传入，新增时为 null */
  baby?: Baby | null;
  onCancel: () => void;
  onSubmit: (data: {
    name: string;
    gender: Gender;
    birthDate: string;
    avatarColor: string;
    avatar?: string;
  }) => void;
}

const BabyEditDialog: React.FC<BabyEditDialogProps> = ({
  visible,
  baby,
  onCancel,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      setName(baby?.name || '');
      setGender(baby?.gender || 'male');
      setBirthDate(baby?.birthDate || new Date().toISOString().slice(0, 10));
      setAvatarColor(baby?.avatarColor || AVATAR_COLORS[0]);
      setAvatar(baby?.avatar);
    }
  }, [visible, baby]);

  if (!visible) return null;

  const handleChooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths?.[0];
        if (!tempPath) return;
        // 持久化到本地用户文件目录，避免临时路径过期
        Taro.getFileSystemManager().saveFile({
          tempFilePath: tempPath,
          success: (saved) => setAvatar(saved.savedFilePath),
          fail: () => setAvatar(tempPath)
        });
      }
    });
  };

  const handleRemoveAvatar = () => {
    Taro.showModal({
      title: '移除头像',
      content: '恢复使用默认首字母头像？',
      confirmText: '移除',
      success: (res) => {
        if (res.confirm) setAvatar(undefined);
      }
    });
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      gender,
      birthDate,
      avatarColor,
      avatar
    });
  };

  return (
    <View className={styles.mask} onClick={onCancel}>
      <View className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text className={styles.title}>{baby ? '编辑宝宝' : '新增宝宝'}</Text>

        <View className={styles.avatarField}>
          {avatar ? (
            <Image
              className={styles.avatarPreview}
              src={avatar}
              mode='aspectFill'
              onClick={handleChooseAvatar}
            />
          ) : (
            <View
              className={styles.avatarPreview}
              style={{ backgroundColor: avatarColor }}
              onClick={handleChooseAvatar}
            >
              <Text className={styles.avatarInitial}>
                {name.slice(0, 1) || '宝'}
              </Text>
              <Text className={styles.avatarPlus}>点击上传</Text>
            </View>
          )}
          <Text
            className={styles.avatarAction}
            onClick={avatar ? handleRemoveAvatar : handleChooseAvatar}
          >
            {avatar ? '更换 / 移除头像' : '上传宝宝照片'}
          </Text>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>昵称</Text>
          <Input
            className={styles.input}
            value={name}
            placeholder="请输入宝宝昵称"
            placeholderClass={styles.placeholder}
            maxlength={12}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>性别</Text>
          <View className={styles.genderRow}>
            <View
              className={classnames(
                styles.genderBtn,
                gender === 'male' && styles.genderActive
              )}
              onClick={() => setGender('male')}
            >
              男 👦
            </View>
            <View
              className={classnames(
                styles.genderBtn,
                gender === 'female' && styles.genderActive
              )}
              onClick={() => setGender('female')}
            >
              女 👧
            </View>
          </View>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>出生日期</Text>
          <Picker
            mode="date"
            value={birthDate}
            end={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.detail.value)}
          >
            <View className={styles.pickerValue}>{birthDate}</View>
          </Picker>
        </View>

        <View className={styles.field}>
          <Text className={styles.fieldLabel}>头像颜色</Text>
          <View className={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <View
                key={c}
                className={classnames(
                  styles.colorDot,
                  avatarColor === c && styles.colorActive
                )}
                style={{ backgroundColor: c }}
                onClick={() => setAvatarColor(c)}
              >
                {avatarColor === c && <Text className={styles.colorCheck}>✓</Text>}
              </View>
            ))}
          </View>
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
            onClick={handleSubmit}
          >
            保存
          </Button>
        </View>
      </View>
    </View>
  );
};

export default BabyEditDialog;
