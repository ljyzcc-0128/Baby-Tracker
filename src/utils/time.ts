// ============================================
// 时间格式化工具
// ============================================
import dayjs from 'dayjs';

/** 格式化"距上次 X 小时前" / "X 分钟前" / "X 天前" */
export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '无记录';
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 0) return '刚刚';
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  if (hour < 24) return `${hour}小时前`;
  if (day < 7) return `${day}天前`;
  return dayjs(timestamp).format('MM-DD HH:mm');
}

/** 时间轴显示格式 */
export function formatTimelineTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm');
}

/** 完整日期时间格式 */
export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
}

/** 今日 0 点时间戳 */
export function startOfToday(): number {
  return dayjs().startOf('day').valueOf();
}

/** 取近 N 天的日期数组（从早到近，今天为最后一天） */
export function lastNDays(n: number): dayjs.Dayjs[] {
  const days: dayjs.Dayjs[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayjs().subtract(i, 'day'));
  }
  return days;
}

/** 计算 0~3 岁月龄描述 */
export function formatAge(birthDate: string): string {
  if (!birthDate) return '';
  const birth = dayjs(birthDate);
  const now = dayjs();
  const months = now.diff(birth, 'month');
  const days = now.diff(birth.add(months, 'month'), 'day');
  if (months < 1) return `${days}天`;
  if (months < 36) return `${months}个月${days > 0 ? days + '天' : ''}`;
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return `${years}岁${remainMonths > 0 ? remainMonths + '个月' : ''}`;
}

/** 时长格式化（分钟→X小时X分） */
export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return '不足1分钟';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 1) return `${m}分钟`;
  return `${h}小时${m > 0 ? m + '分' : ''}`;
}
