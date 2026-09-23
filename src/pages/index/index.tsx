// ============================================
// 首页：一键记录 + 今日时间轴
// ============================================
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import { useStore } from '@/store/useStore';
import { RECORD_TYPES, RECORD_TYPE_MAP, SLEEP_QUALITY } from '@/constants/recordTypes';
import type { RecordItem, RecordType } from '@/types';
import {
  useTodayRecords,
  useLastRecordMap,
  useActiveTiming
} from '@/hooks/useRecords';
import BabySwitcher from '@/components/BabySwitcher';
import RecordButton from '@/components/RecordButton';
import Timeline from '@/components/Timeline';
import InputDialog from '@/components/InputDialog';
import { formatDuration, formatAge, startOfToday } from '@/utils/time';
import { buildHandoverImage, shareOrSaveImage } from '@/utils/imageExporter';
import styles from './index.module.scss';

interface PendingInput {
  type: RecordType;
  title: string;
  placeholder?: string;
  inputType: 'number' | 'text';
  unit?: string;
}

const IndexPage: React.FC = () => {
  const babies = useStore((s) => s.babies);
  const currentBabyId = useStore((s) => s.currentBabyId);
  const records = useStore((s) => s.records);
  const dark = useStore((s) => s.dark);
  const settings = useStore((s) => s.settings);
  const toggleDark = useStore((s) => s.toggleDark);
  const addRecord = useStore((s) => s.addRecord);
  const completeTiming = useStore((s) => s.completeTiming);
  const deleteRecord = useStore((s) => s.deleteRecord);

  const todayRecords = useTodayRecords();
  const lastMap = useLastRecordMap();
  const activeTiming = useActiveTiming();

  const baby = babies.find((b) => b.id === currentBabyId);

  const [dialog, setDialog] = useState<{
    visible: boolean;
    pending: PendingInput | null;
  }>({ visible: false, pending: null });

  // 奶瓶结束时的"剩余量"弹窗
  const [exitDialog, setExitDialog] = useState<{
    visible: boolean;
    recordId: string;
  }>({ visible: false, recordId: '' });

  // 异常提醒（温和提示，可关闭）
  const [alertDismissed, setAlertDismissed] = useState(false);
  const healthAlert = useMemo(() => {
    if (!currentBabyId) return null;
    const now = dayjs();
    if (now.hour() < 18) return null; // 晚 18 点后才检查
    const todays = records.filter(
      (r) => r.babyId === currentBabyId && r.startTime >= startOfToday()
    );
    // 今日排便 0 次
    if (!todays.some((r) => r.type === 'poop')) {
      return '今天还没有排便记录，留意一下宝宝状态哦';
    }
    // 今日奶量低于近 7 天日均的 60%（仅对有瓶喂的宝宝）
    const milkToday = todays
      .filter((r) => r.type === 'bottle')
      .reduce((s, r) => s + (r.value ?? 0), 0);
    let sum = 0;
    let days = 0;
    for (let i = 1; i <= 7; i++) {
      const dStart = now.subtract(i, 'day').startOf('day').valueOf();
      const dEnd = now.subtract(i, 'day').endOf('day').valueOf();
      const dMilk = records
        .filter(
          (r) =>
            r.babyId === currentBabyId &&
            r.type === 'bottle' &&
            r.startTime >= dStart &&
            r.startTime <= dEnd
        )
        .reduce((s, r) => s + (r.value ?? 0), 0);
      if (dMilk > 0) {
        sum += dMilk;
        days++;
      }
    }
    const avg = days ? sum / days : 0;
    if (avg > 0 && milkToday < avg * 0.6) {
      return `今日奶量约 ${Math.round(milkToday)}ml，低于近7天日均（${Math.round(avg)}ml），注意观察哦`;
    }
    return null;
  }, [records, currentBabyId]);

  // 提醒内容变化时恢复显示
  useEffect(() => {
    setAlertDismissed(false);
  }, [healthAlert]);

  // 尿不湿库存提醒（设置过库存且低于阈值时提示）
  const diaperAlert = useMemo(() => {
    const { diaperStock, diaperStockThreshold } = settings;
    if (diaperStock > 0 && diaperStock <= diaperStockThreshold) {
      return `尿不湿仅剩 ${diaperStock} 片，记得补货哦`;
    }
    return null;
  }, [settings]);

  // 页面显示时刷新（从其他 tab 切回）
  useDidShow(() => {
    if (!currentBabyId && babies.length === 0) {
      useStore.getState().hydrate();
    }
  });

  usePullDownRefresh(() => {
    useStore.getState().hydrate();
    Taro.stopPullDownRefresh();
  });

  /** 结束计时（通用提示） */
  const finishTiming = (
    patch?: { quality?: 'good' | 'ok' | 'restless'; value?: number; unit?: string; note?: string }
  ) => {
    if (!activeTiming) return;
    const endTime = Date.now();
    completeTiming(activeTiming.id, endTime, patch);
    const activeCfg = RECORD_TYPE_MAP[activeTiming.type];
    Taro.showToast({
      title:
        patch && patch.value != null
          ? `实际摄入 ${patch.value}ml`
          : `${activeCfg.label} ${formatDuration(endTime - activeTiming.startTime)}`,
      icon: 'success'
    });
  };

  const handleButtonClick = (type: RecordType) => {
    const cfg = RECORD_TYPE_MAP[type];

    // 计时类型（睡眠/母乳/奶瓶）：点一下开始，再点一下结束
    if (cfg.timing) {
      if (activeTiming) {
        // 奶瓶结束时先问剩余量，算实际摄入
        if (activeTiming.type === 'bottle') {
          setExitDialog({ visible: true, recordId: activeTiming.id });
          return;
        }
        // 睡眠结束时标记质量（取消则继续计时）
        if (activeTiming.type === 'sleep') {
          Taro.showActionSheet({
            alertText: '宝宝睡得怎么样？',
            itemList: SLEEP_QUALITY.map((q) => `${q.icon} ${q.label}`),
            success: (res) => {
              finishTiming({ quality: SLEEP_QUALITY[res.tapIndex].key });
            },
            fail: () => {}
          });
          return;
        }
        finishTiming();
        return;
      }

      if (type === 'bottle') {
        // 奶瓶：先输入冲调量，再开始计时
        setDialog({
          visible: true,
          pending: {
            type,
            title: '冲调奶量',
            placeholder: cfg.inputPlaceholder,
            inputType: 'number',
            unit: cfg.unit
          }
        });
      } else if (type === 'breast') {
        // 母乳：选择先喂哪一侧，并根据上次给出换边建议
        const lastSide = records.find(
          (r) => r.babyId === currentBabyId && r.type === 'breast' && r.side
        )?.side;
        Taro.showActionSheet({
          alertText: lastSide
            ? `上次先喂${lastSide === 'left' ? '左' : '右'}侧，建议这次先喂${lastSide === 'left' ? '右' : '左'}侧`
            : '选择本次先喂哪一侧',
          itemList: ['先喂左侧', '先喂右侧'],
          success: (res) => {
            const side = res.tapIndex === 0 ? 'left' : 'right';
            addRecord({ type, side, startTime: Date.now() });
            Taro.showToast({
              title: `开始计时（${side === 'left' ? '左' : '右'}侧）`,
              icon: 'none'
            });
          }
        });
      } else {
        // 睡眠：直接开始计时
        addRecord({ type, startTime: Date.now() });
        Taro.showToast({ title: `开始${cfg.label}计时`, icon: 'none' });
      }
      return;
    }

    // 大便：选择性状
    if (type === 'poop') {
      const textures = ['稀', '软', '正常', '干硬', '颗粒'];
      Taro.showActionSheet({
        alertText: '选择大便性状',
        itemList: textures,
        success: (res) => {
          const texture = textures[res.tapIndex];
          addRecord({ type, note: `性状：${texture}`, startTime: Date.now() });
          Taro.showToast({ title: `大便·${texture} 已记录`, icon: 'success' });
        }
      });
      return;
    }

    // 需要输入的类型
    if (cfg.inputKind !== 'none') {
      setDialog({
        visible: true,
        pending: {
          type,
          title: cfg.label,
          placeholder: cfg.inputPlaceholder,
          inputType: cfg.inputKind === 'number' ? 'number' : 'text',
          unit: cfg.unit
        }
      });
      return;
    }

    // 直接记录
    addRecord({ type, startTime: Date.now() });
    Taro.showToast({ title: `${cfg.label} 已记录`, icon: 'success' });
  };

  /** 奶瓶结束：输入剩余量，自动计算实际摄入 */
  const handleExitConfirm = (value: string) => {
    const recordId = exitDialog.recordId;
    setExitDialog({ visible: false, recordId: '' });
    const rec = useStore.getState().records.find((r) => r.id === recordId);
    if (!rec) return;

    const trimmed = value.trim();
    if (!trimmed) {
      // 没填剩余量 = 全部喝完，按冲调量计
      finishTiming();
      return;
    }
    const remaining = parseFloat(trimmed);
    if (isNaN(remaining) || remaining < 0) {
      Taro.showToast({ title: '请输入有效数字', icon: 'none' });
      return;
    }
    const mixed = rec.value ?? 0;
    const actual = Math.max(0, Math.round((mixed - remaining) * 10) / 10);
    finishTiming({
      value: actual,
      unit: 'ml',
      note: `冲调${mixed}ml·剩余${trimmed}ml`
    });
  };

  const handleDialogConfirm = (value: string) => {
    const pending = dialog.pending;
    if (!pending) return;
    const trimmed = value.trim();
    if (!trimmed) {
      Taro.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const cfg = RECORD_TYPE_MAP[pending.type];
    const baseData: Parameters<typeof addRecord>[0] = {
      type: pending.type,
      startTime: Date.now()
    };

    if (pending.type === 'custom') {
      baseData.customName = trimmed;
    } else if (cfg.inputKind === 'number') {
      const num = parseFloat(trimmed);
      if (isNaN(num)) {
        Taro.showToast({ title: '请输入数字', icon: 'none' });
        return;
      }
      baseData.value = num;
      baseData.unit = cfg.unit;
    } else {
      // 文本类（辅食/药品）记到 note
      baseData.note = trimmed;
    }

    addRecord(baseData);
    setDialog({ visible: false, pending: null });
    // 奶瓶：输入奶量后开始计时
    if (pending.type === 'bottle') {
      Taro.showToast({ title: '开始奶瓶计时', icon: 'none' });
    } else {
      Taro.showToast({ title: `${cfg.label} 已记录`, icon: 'success' });
    }
  };

  const handleDelete = (id: string) => {
    deleteRecord(id);
    Taro.showToast({ title: '已删除', icon: 'none' });
  };

  /** 单条记录 → 摘要文本 */
  const recordToText = (r: RecordItem): string => {
    const cfg = RECORD_TYPE_MAP[r.type];
    const label = r.type === 'custom' ? r.customName || '自定义' : cfg.label;
    const parts: string[] = [];
    if (r.type === 'breast' && r.side) parts.push(r.side === 'left' ? '左侧' : '右侧');
    if (r.value != null) parts.push(`${r.value}${r.unit || ''}`);
    if (r.endTime) parts.push(formatDuration(r.endTime - r.startTime));
    if (r.note) parts.push(r.note);
    return parts.length ? `${label} ${parts.join(' · ')}` : label;
  };

  /** 生成交接班摘要图并分享/保存 */
  const handleHandover = async () => {
    if (!baby) return;
    const todays = records
      .filter((r) => r.babyId === baby.id && r.startTime >= startOfToday())
      .sort((a, b) => a.startTime - b.startTime);
    const count = (t: RecordType) => todays.filter((r) => r.type === t).length;
    const sumDuration = (t: RecordType) =>
      todays
        .filter((r) => r.type === t && r.endTime)
        .reduce((s, r) => s + ((r.endTime as number) - r.startTime), 0);
    const milk = todays
      .filter((r) => r.type === 'bottle')
      .reduce((s, r) => s + (r.value ?? 0), 0);
    const breastMs = sumDuration('breast');
    const sleepMs = sumDuration('sleep');
    const temps = todays.filter((r) => r.type === 'temperature' && r.value != null);

    const summaryLines: { label: string; value: string; accent?: boolean }[] = [
      { label: '母乳亲喂', value: `${count('breast')} 次${breastMs ? ` · ${formatDuration(breastMs)}` : ''}` },
      { label: '奶瓶喂养', value: milk ? `${milk}ml` : `${count('bottle')} 次` },
      { label: '小便 / 大便', value: `${count('pee')} 次 / ${count('poop')} 次` },
      { label: '睡眠', value: sleepMs ? formatDuration(sleepMs) : '无记录' }
    ];
    if (temps.length) {
      summaryLines.push({
        label: '体温',
        value: `${Math.max(...temps.map((r) => r.value as number))}°C（最高）`,
        accent: true
      });
    }
    if (settings.diaperStock > 0) {
      summaryLines.push({ label: '尿不湿库存', value: `约 ${settings.diaperStock} 片` });
    }

    try {
      Taro.showLoading({ title: '生成中…' });
      const filePath = await buildHandoverImage({
        babyName: baby.name,
        ageText: `月龄 ${formatAge(baby.birthDate)}`,
        dateText: dayjs().format('YYYY年M月D日'),
        summaryLines,
        timeline: todays.map((r) => ({
          time: dayjs(r.startTime).format('HH:mm'),
          text: recordToText(r)
        }))
      });
      Taro.hideLoading();
      await shareOrSaveImage(filePath);
    } catch {
      Taro.hideLoading();
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' });
    }
  };

  // 计时中展示用的时长
  const timingDurationText = useMemo(() => {
    if (!activeTiming) return '';
    return formatDuration(Date.now() - activeTiming.startTime);
  }, [activeTiming]);

  const activeCfg = activeTiming ? RECORD_TYPE_MAP[activeTiming.type] : null;

  return (
    <View className={classnames(styles.page, dark && 'theme-dark')}>
      <View className={styles.switcherWrap}>
        <View className={styles.switcherMain}>
          <BabySwitcher />
        </View>
        <View className={styles.themeBtn} onClick={toggleDark}>
          <Text>{dark ? '🌞' : '🌙'}</Text>
        </View>
      </View>

      {healthAlert && !alertDismissed && (
        <View className={styles.alertBanner}>
          <Text className={styles.alertIcon}>💡</Text>
          <Text className={styles.alertText}>{healthAlert}</Text>
          <Text
            className={styles.alertClose}
            onClick={() => setAlertDismissed(true)}
          >
            ✕
          </Text>
        </View>
      )}

      {diaperAlert && (
        <View className={styles.alertBanner}>
          <Text className={styles.alertIcon}>🧷</Text>
          <Text className={styles.alertText}>{diaperAlert}</Text>
        </View>
      )}

      {activeTiming && activeCfg && (
        <View
          className={styles.timingTip}
          style={{ background: `${activeCfg.color}1f` }}
        >
          <Text className={styles.timingTipIcon}>{activeCfg.icon}</Text>
          <Text
            className={styles.timingTipText}
            style={{ color: activeCfg.color }}
          >
            {activeCfg.label}计时中 · 已{activeCfg.label} {timingDurationText}
          </Text>
          <Button
            className={styles.timingTipAction}
            style={{ background: activeCfg.color }}
            onClick={() => handleButtonClick(activeTiming.type)}
          >
            结束
          </Button>
        </View>
      )}

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionTitleText}>一键记录</Text>
      </View>
      <View className={styles.grid}>
        {RECORD_TYPES.map((cfg) => {
          const key =
            cfg.type === 'custom' ? 'custom_' : cfg.type;
          const lastTime = lastMap[key];
          const isTiming =
            !!activeTiming && cfg.type === activeTiming.type;
          return (
            <View key={cfg.type} className={styles.gridItem}>
              <RecordButton
                config={cfg}
                lastTime={lastTime}
                timing={isTiming}
                onClick={() => handleButtonClick(cfg.type)}
              />
            </View>
          );
        })}
      </View>

      <View className={styles.sectionTitle}>
        <Text className={styles.sectionTitleText}>今日记录</Text>
        <Text className={styles.countBadge}>{todayRecords.length}</Text>
        <Text className={styles.handoverBtn} onClick={handleHandover}>
          🤝 交接班
        </Text>
      </View>
      <Timeline records={todayRecords} onDelete={handleDelete} />

      <InputDialog
        visible={dialog.visible}
        title={dialog.pending?.title || ''}
        placeholder={dialog.pending?.placeholder}
        inputType={dialog.pending?.inputType}
        unit={dialog.pending?.unit}
        onCancel={() => setDialog({ visible: false, pending: null })}
        onConfirm={handleDialogConfirm}
      />

      <InputDialog
        visible={exitDialog.visible}
        title="剩余奶量"
        placeholder="喝完了可不填"
        inputType="number"
        unit="ml"
        confirmText="结束"
        onCancel={() => setExitDialog({ visible: false, recordId: '' })}
        onConfirm={handleExitConfirm}
      />
    </View>
  );
};

export default IndexPage;
