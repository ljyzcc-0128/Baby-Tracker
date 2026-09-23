// ============================================
// 宝宝管理页：多宝宝切换 / 新增 / 编辑 / 删除
// ============================================
import React, { useState } from 'react';
import { View, Text, Button, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import type { Baby } from '@/types';
import BabyEditDialog from '@/components/BabyEditDialog';
import { formatAge } from '@/utils/time';
import styles from './index.module.scss';

const ProfilePage: React.FC = () => {
  const babies = useStore((s) => s.babies);
  const currentBabyId = useStore((s) => s.currentBabyId);
  const addBaby = useStore((s) => s.addBaby);
  const updateBaby = useStore((s) => s.updateBaby);
  const deleteBaby = useStore((s) => s.deleteBaby);
  const switchBaby = useStore((s) => s.switchBaby);
  const records = useStore((s) => s.records);
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);

  const [editVisible, setEditVisible] = useState(false);
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null);

  const handleAdd = () => {
    setEditingBaby(null);
    setEditVisible(true);
  };

  const handleEdit = (baby: Baby) => {
    setEditingBaby(baby);
    setEditVisible(true);
  };

  const handleSubmit = (data: {
    name: string;
    gender: 'male' | 'female';
    birthDate: string;
    avatarColor: string;
  }) => {
    if (editingBaby) {
      updateBaby(editingBaby.id, data);
      Taro.showToast({ title: '已更新', icon: 'success' });
    } else {
      addBaby(data);
      Taro.showToast({ title: '已添加', icon: 'success' });
    }
    setEditVisible(false);
    setEditingBaby(null);
  };

  const handleDelete = (baby: Baby) => {
    Taro.showModal({
      title: '删除宝宝',
      content: `确定删除「${baby.name}」及其所有记录吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          deleteBaby(baby.id);
          Taro.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  };

  const handleSelectBaby = (baby: Baby) => {
    if (baby.id === currentBabyId) return;
    switchBaby(baby.id);
    Taro.showToast({ title: `已切换到 ${baby.name}`, icon: 'none' });
  };

  return (
    <View className={classnames(styles.page, dark && 'theme-dark')}>
      <View className={styles.header}>
        <Text className={styles.appTitle}>宝宝管理</Text>
        <Text className={styles.appDesc}>适合双胞胎/二胎家庭，一键切换记录对象</Text>
      </View>

      <View className={styles.sectionTitle}>
        <Text>宝宝列表（{babies.length}）</Text>
        <Button className={styles.addBtn} onClick={handleAdd}>
          + 新增
        </Button>
      </View>

      {babies.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>👶</Text>
          <Text className={styles.emptyText}>还没有添加宝宝</Text>
          <Button className={styles.addBtn} onClick={handleAdd}>
            添加第一个宝宝
          </Button>
        </View>
      ) : (
        babies.map((baby) => {
          const babyRecords = records.filter((r) => r.babyId === baby.id);
          return (
            <View
              key={baby.id}
              className={classnames(
                styles.babyCard,
                baby.id === currentBabyId && styles.babyCardCurrent
              )}
              onClick={() => handleSelectBaby(baby)}
            >
              <View
                className={styles.avatar}
                style={{ backgroundColor: baby.avatarColor }}
              >
                <Text className={styles.avatarText}>{baby.name.slice(0, 1)}</Text>
              </View>
              <View className={styles.babyInfo}>
                <View className={styles.babyName}>
                  <Text>{baby.name}</Text>
                  {baby.id === currentBabyId && (
                    <Text className={styles.currentTag}>当前</Text>
                  )}
                </View>
                <Text className={styles.babyMeta}>
                  {baby.gender === 'male' ? '男' : '女'} · {formatAge(baby.birthDate)} · {babyRecords.length} 条记录
                </Text>
                <Text className={styles.babyMeta}>
                  出生 {baby.birthDate}
                </Text>
              </View>
              <View className={styles.actionCol}>
                <View
                  className={styles.iconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(baby);
                  }}
                >
                  ✏️
                </View>
                <View
                  className={styles.iconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(baby);
                  }}
                >
                  🗑
                </View>
              </View>
            </View>
          );
        })
      )}

      <View className={styles.settingsCard}>
        <View
          className={classnames(styles.settingRow, styles.entryRow)}
          onClick={() => Taro.navigateTo({ url: '/pages/growth/index' })}
        >
          <Text className={styles.settingIcon}>📈</Text>
          <View className={styles.settingInfo}>
            <Text className={styles.settingLabel}>生长曲线</Text>
            <Text className={styles.settingDesc}>
              记录身高体重头围，对比 WHO 标准曲线
            </Text>
          </View>
          <Text className={styles.entryArrow}>›</Text>
        </View>
        <View className={styles.settingRow}>
          <Text className={styles.settingIcon}>🌙</Text>
          <View className={styles.settingInfo}>
            <Text className={styles.settingLabel}>夜间模式</Text>
            <Text className={styles.settingDesc}>夜奶时降低亮度，深灰背景防刺眼</Text>
          </View>
          <Switch
            checked={dark}
            color="#ff8c5a"
            onChange={toggleDark}
          />
        </View>
      </View>

      <View className={styles.tip}>
        <Text className={styles.tipTitle}>使用提示</Text>
        <Text className={styles.tipItem}>
          <Text className={styles.tipDot}>·</Text>
          点击宝宝卡片可切换为当前记录对象
        </Text>
        <Text className={styles.tipItem}>
          <Text className={styles.tipDot}>·</Text>
          所有数据保存在本机，卸载微信或清除小程序缓存会丢失
        </Text>
        <Text className={styles.tipItem}>
          <Text className={styles.tipDot}>·</Text>
          母乳/奶瓶/睡眠点两下自动计时：第一下开始，第二下结束
        </Text>
        <Text className={styles.tipItem}>
          <Text className={styles.tipDot}>·</Text>
          母乳可选先喂左侧/右侧，奶瓶结束可填剩余量自动算实际摄入
        </Text>
        <Text className={styles.tipItem}>
          <Text className={styles.tipDot}>·</Text>
          睡眠结束时可标记质量，统计页查看本周安稳占比
        </Text>
        <Text className={styles.tipItem}>
          <Text className={styles.tipDot}>·</Text>
          今日记录长按可删除
        </Text>
      </View>

      <BabyEditDialog
        visible={editVisible}
        baby={editingBaby}
        onCancel={() => {
          setEditVisible(false);
          setEditingBaby(null);
        }}
        onSubmit={handleSubmit}
      />
    </View>
  );
};

export default ProfilePage;
