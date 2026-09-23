// ============================================
// 生长曲线页：身高/体重/头围记录 + WHO 参考曲线
// ============================================
import React, { useMemo, useState } from 'react';
import { View, Text, Button, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import BabySwitcher from '@/components/BabySwitcher';
import LineChart from '@/components/LineChart';
import {
  GROWTH_METRICS,
  whoP50Curve,
  whoP50
} from '@/utils/whoStandards';
import type { GrowthMetric } from '@/utils/whoStandards';
import { formatAge } from '@/utils/time';
import styles from './index.module.scss';

const TODAY = () => dayjs().format('YYYY-MM-DD');

const GrowthPage: React.FC = () => {
  const babies = useStore((s) => s.babies);
  const currentBabyId = useStore((s) => s.currentBabyId);
  const growthRecords = useStore((s) => s.growthRecords);
  const dark = useStore((s) => s.dark);
  const addGrowth = useStore((s) => s.addGrowth);
  const deleteGrowth = useStore((s) => s.deleteGrowth);

  const [metric, setMetric] = useState<GrowthMetric>('weight');
  const [formVisible, setFormVisible] = useState(false);
  const [formDate, setFormDate] = useState(TODAY());
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [headCirc, setHeadCirc] = useState('');

  useDidShow(() => {
    if (!currentBabyId && babies.length === 0) {
      useStore.getState().hydrate();
    }
  });

  const baby = babies.find((b) => b.id === currentBabyId);

  const myGrowth = useMemo(
    () =>
      growthRecords
        .filter((g) => g.babyId === currentBabyId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [growthRecords, currentBabyId]
  );

  /** 测量日期 → 月龄（含小数） */
  const toMonthAge = (date: string): number => {
    if (!baby) return 0;
    return dayjs(date).diff(dayjs(baby.birthDate), 'day') / 30.4375;
  };

  const metricCfg = GROWTH_METRICS.find((m) => m.key === metric)!;

  const points = useMemo(
    () =>
      myGrowth
        .filter((g) => g[metric] != null)
        .map((g) => ({ x: toMonthAge(g.date), y: g[metric] as number })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myGrowth, metric, baby?.birthDate]
  );

  const refLine = useMemo(
    () => (baby ? whoP50Curve(baby.gender, metric) : []),
    [baby, metric]
  );

  /** 各指标最新一次测量值 + 与 WHO 中位对比 */
  const latestList = useMemo(() => {
    return GROWTH_METRICS.map((m) => {
      const last = [...myGrowth].reverse().find((g) => g[m.key] != null);
      if (!last) return { ...m, value: null as number | null, date: '', diff: null as number | null };
      const value = last[m.key] as number;
      const ref = baby ? whoP50(baby.gender, m.key, toMonthAge(last.date)) : null;
      return {
        ...m,
        value,
        date: last.date,
        diff: ref != null ? Number((value - ref).toFixed(1)) : null
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myGrowth, baby]);

  const handleOpenForm = () => {
    setFormDate(TODAY());
    setHeight('');
    setWeight('');
    setHeadCirc('');
    setFormVisible(true);
  };

  const handleSubmit = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const hc = parseFloat(headCirc);
    const hasAny =
      (!isNaN(h) && h > 0) || (!isNaN(w) && w > 0) || (!isNaN(hc) && hc > 0);
    if (!hasAny) {
      Taro.showToast({ title: '请至少填写一项数值', icon: 'none' });
      return;
    }
    addGrowth({
      date: formDate,
      height: !isNaN(h) && h > 0 ? h : undefined,
      weight: !isNaN(w) && w > 0 ? w : undefined,
      headCirc: !isNaN(hc) && hc > 0 ? hc : undefined
    });
    setFormVisible(false);
    Taro.showToast({ title: '已记录', icon: 'success' });
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '删除测量记录',
      content: '确定删除这条测量记录吗？',
      confirmText: '删除',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          deleteGrowth(id);
          Taro.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  };

  return (
    <View className={classnames(styles.page, dark && 'theme-dark')}>
      <View className={styles.header}>
        <BabySwitcher />
        {baby && (
          <Text className={styles.ageText}>
            {baby.name} · 月龄 {formatAge(baby.birthDate)}
          </Text>
        )}
      </View>

      {/* 指标切换 */}
      <View className={styles.metricTabs}>
        {GROWTH_METRICS.map((m) => (
          <View
            key={m.key}
            className={classnames(
              styles.metricTab,
              metric === m.key && styles.metricTabActive
            )}
            onClick={() => setMetric(m.key)}
          >
            {m.icon} {m.label}
          </View>
        ))}
      </View>

      {/* 曲线图 */}
      <View className={styles.card}>
        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={styles.legendLine} />
            <Text className={styles.legendText}>宝宝测量</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendLine, styles.legendRef)} />
            <Text className={styles.legendText}>WHO 中位参考</Text>
          </View>
        </View>
        {points.length > 0 ? (
          <LineChart
            points={points}
            refLine={refLine}
            color='#ff8c5a'
            unit={metricCfg.unit}
            dark={dark}
          />
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📈</Text>
            <Text className={styles.emptyText}>
              还没有{metricCfg.label}数据
            </Text>
            <Text className={styles.emptyHint}>
              添加测量后即可看到与 WHO 参考曲线的对比
            </Text>
          </View>
        )}
      </View>

      {/* 最新测量值 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>最新测量</Text>
        <View className={styles.latestRow}>
          {latestList.map((m) => (
            <View key={m.key} className={styles.latestItem}>
              <Text className={styles.latestLabel}>
                {m.icon} {m.label}
              </Text>
              {m.value != null ? (
                <Text className={styles.latestValue}>
                  {m.value}
                  {m.unit}
                </Text>
              ) : (
                <Text className={styles.latestValue}>--</Text>
              )}
              {m.value != null && m.diff != null && (
                <Text
                  className={classnames(
                    styles.latestDiff,
                    m.diff >= 0 ? styles.diffUp : styles.diffDown
                  )}
                >
                  {m.diff >= 0 ? '+' : ''}
                  {m.diff} vs WHO
                </Text>
              )}
            </View>
          ))}
        </View>
        <Button className={styles.addBtn} onClick={handleOpenForm}>
          ＋ 添加测量
        </Button>
      </View>

      {/* 测量历史 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>
          测量记录（{myGrowth.length}）
        </Text>
        {myGrowth.length === 0 ? (
          <Text className={styles.emptyHint}>暂无测量记录</Text>
        ) : (
          [...myGrowth].reverse().map((g) => (
            <View key={g.id} className={styles.recordRow}>
              <View className={styles.recordInfo}>
                <Text className={styles.recordDate}>
                  {g.date.slice(5)}（月龄 {Math.floor(toMonthAge(g.date))} 个月）
                </Text>
                <Text className={styles.recordValues}>
                  {[
                    g.weight != null && `体重 ${g.weight}kg`,
                    g.height != null && `身高 ${g.height}cm`,
                    g.headCirc != null && `头围 ${g.headCirc}cm`
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <View
                className={styles.deleteBtn}
                onClick={() => handleDelete(g.id)}
              >
                🗑
              </View>
            </View>
          ))
        )}
      </View>

      {/* 添加测量弹窗 */}
      {formVisible && (
        <View className={styles.mask} onClick={() => setFormVisible(false)}>
          <View
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <Text className={styles.dialogTitle}>添加测量</Text>

            <View className={styles.field}>
              <Text className={styles.fieldLabel}>测量日期</Text>
              <Picker
                mode='date'
                value={formDate}
                end={TODAY()}
                onChange={(e) => setFormDate(e.detail.value)}
              >
                <View className={styles.pickerValue}>{formDate}</View>
              </Picker>
            </View>

            <View className={styles.field}>
              <Text className={styles.fieldLabel}>体重（kg）</Text>
              <Input
                className={styles.input}
                type='digit'
                value={weight}
                placeholder='如 7.5'
                placeholderClass={styles.placeholder}
                onInput={(e) => setWeight(e.detail.value)}
              />
            </View>

            <View className={styles.field}>
              <Text className={styles.fieldLabel}>身高（cm）</Text>
              <Input
                className={styles.input}
                type='digit'
                value={height}
                placeholder='如 67.5'
                placeholderClass={styles.placeholder}
                onInput={(e) => setHeight(e.detail.value)}
              />
            </View>

            <View className={styles.field}>
              <Text className={styles.fieldLabel}>头围（cm）</Text>
              <Input
                className={styles.input}
                type='digit'
                value={headCirc}
                placeholder='如 43.0'
                placeholderClass={styles.placeholder}
                onInput={(e) => setHeadCirc(e.detail.value)}
              />
            </View>

            <View className={styles.actions}>
              <Button
                className={classnames(styles.btn, styles.btnCancel)}
                onClick={() => setFormVisible(false)}
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
      )}
    </View>
  );
};

export default GrowthPage;
