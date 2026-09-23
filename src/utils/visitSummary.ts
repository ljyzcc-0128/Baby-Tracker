// ============================================
// 就诊摘要生成器：把一段时间内的记录聚合成
// 可复制给医生看的结构化文本
// ============================================
import dayjs from 'dayjs';
import type { Baby, RecordItem } from '@/types';
import { formatDuration } from './time';

/** 汇总一段时间内的记录条数与数值 */
function pick(records: RecordItem[], type: string): RecordItem[] {
  return records.filter((r) => r.type === type);
}

function sumDurations(records: RecordItem[]): number {
  return records.reduce(
    (sum, r) => sum + (r.endTime ? r.endTime - r.startTime : 0),
    0
  );
}

/**
 * 生成就诊摘要文本
 * @param days 时间范围天数（1=今天）
 */
export function buildVisitSummary(
  records: RecordItem[],
  baby: Baby,
  days: number
): string {
  const now = dayjs();
  const start = now.subtract(days - 1, 'day').startOf('day');
  const inRange = records.filter(
    (r) => r.startTime >= start.valueOf() && r.startTime <= now.valueOf()
  );

  const lines: string[] = [];
  lines.push('【宝宝就诊摘要】');
  const genderText = baby.gender === 'male' ? '男' : '女';
  lines.push(`宝宝：${baby.name}（${genderText}，出生 ${baby.birthDate}）`);
  lines.push(
    `时间范围：${days === 1 ? '今天' : `近${days}天`}（${start.format('MM-DD')} ~ ${now.format('MM-DD')}）`
  );
  lines.push('');

  // ===== 喂养 =====
  const breast = pick(inRange, 'breast');
  const bottle = pick(inRange, 'bottle');
  const food = pick(inRange, 'food');
  const water = pick(inRange, 'water');
  lines.push('■ 喂养');
  if (breast.length) {
    lines.push(
      `· 母乳亲喂：${breast.length} 次，累计约 ${formatDuration(sumDurations(breast))}`
    );
  }
  if (bottle.length) {
    const totalMl = bottle.reduce((sum, r) => sum + (r.value ?? 0), 0);
    lines.push(`· 奶瓶：${bottle.length} 次，实际摄入约 ${Math.round(totalMl)}ml`);
  }
  if (food.length) {
    lines.push(`· 辅食：${food.length} 次`);
  }
  if (water.length) {
    lines.push(`· 喂水：${water.length} 次`);
  }
  if (!breast.length && !bottle.length && !food.length && !water.length) {
    lines.push('· 该时段暂无喂养记录');
  }
  lines.push('');

  // ===== 排泄 =====
  const pee = pick(inRange, 'pee');
  const poop = pick(inRange, 'poop');
  lines.push('■ 排泄');
  lines.push(`· 小便：${pee.length} 次`);
  if (poop.length) {
    const textures = poop
      .map((r) => (r.note || '').replace('性状：', ''))
      .filter(Boolean);
    const textureText = textures.length
      ? `（性状：${textures.join('、')}）`
      : '';
    lines.push(`· 大便：${poop.length} 次${textureText}`);
  } else {
    lines.push('· 大便：0 次');
  }
  lines.push('');

  // ===== 睡眠 =====
  const sleep = pick(inRange, 'sleep');
  if (sleep.length) {
    lines.push('■ 睡眠');
    lines.push(
      `· ${sleep.length} 次，累计约 ${formatDuration(sumDurations(sleep))}`
    );
    lines.push('');
  }

  // ===== 健康 =====
  const temp = pick(inRange, 'temperature');
  const medicine = pick(inRange, 'medicine');
  const hasHealth = temp.length > 0 || medicine.length > 0;
  if (hasHealth) {
    lines.push('■ 健康');
    if (temp.length) {
      const maxTemp = Math.max(...temp.map((r) => r.value ?? 0));
      lines.push(`· 体温：测量 ${temp.length} 次，最高 ${maxTemp}°C`);
    }
    if (medicine.length) {
      medicine.forEach((r) => {
        const name = r.note || '未知药品';
        lines.push(`· 用药：${name}（${dayjs(r.startTime).format('MM-DD HH:mm')}）`);
      });
    }
    lines.push('');
  }

  lines.push(`生成于 ${now.format('YYYY-MM-DD HH:mm')}，数据来自本机记录，仅供参考`);

  if (inRange.length === 0) {
    lines.unshift('（该时段暂无任何记录）');
  }
  return lines.join('\n');
}
