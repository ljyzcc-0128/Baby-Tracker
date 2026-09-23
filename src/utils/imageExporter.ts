// ============================================
// 长图导出：offscreen canvas 绘制统计长图/交接班摘要图
// ============================================
import Taro from '@tarojs/taro';

/** 逻辑宽度（750 设计稿基准），实际按 2 倍像素绘制保证清晰度 */
const W = 750;
const PAD = 40;
const SCALE = 2;
const MAX_H = 2000; // 逻辑高度上限，超长内容截断

const C_PRIMARY = '#ff8c5a';
const C_PRIMARY_LIGHT = '#ffb088';
const C_BG = '#fff7f2';
const C_T1 = '#2d2a26';
const C_T2 = '#6b6560';
const C_T3 = '#a39e99';
const C_WHITE = '#ffffff';

/* eslint-disable @typescript-eslint/no-explicit-any */

function setupCanvas(height: number): { canvas: any; ctx: any } {
  const canvas = (Taro as any).createOffscreenCanvas({
    type: '2d',
    width: W * SCALE,
    height: height * SCALE
  });
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'top';
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, W, height);
  return { canvas, ctx };
}

function drawHeader(ctx: any, title: string, subtitle: string): number {
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, C_PRIMARY);
  grad.addColorStop(1, C_PRIMARY_LIGHT);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 190);
  ctx.fillStyle = C_WHITE;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, PAD, 44);
  ctx.font = '26px sans-serif';
  ctx.globalAlpha = 0.95;
  ctx.fillText(subtitle, PAD, 116);
  ctx.globalAlpha = 1;
  return 226;
}

function drawSection(ctx: any, y: number, text: string): number {
  ctx.fillStyle = C_T1;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(text, PAD, y);
  return y + 54;
}

function drawKV(ctx: any, y: number, label: string, value: string, accent = false): number {
  ctx.font = '26px sans-serif';
  ctx.fillStyle = C_T2;
  ctx.fillText(label, PAD, y);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = accent ? C_PRIMARY : C_T1;
  ctx.fillText(value, W - PAD - ctx.measureText(value).width, y);
  return y + 50;
}

function drawBarRow(ctx: any, y: number, label: string, count: number, max: number): number {
  ctx.font = '26px sans-serif';
  ctx.fillStyle = C_T2;
  ctx.fillText(label, PAD, y + 4);
  const barX = PAD + 170;
  const barMaxW = W - PAD * 2 - 170 - 80;
  const bw = max > 0 && count > 0 ? Math.max(6, (count / max) * barMaxW) : 4;
  ctx.fillStyle = C_PRIMARY;
  ctx.fillRect(barX, y, bw, 32);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = C_T1;
  ctx.fillText(String(count), barX + barMaxW + 14, y + 4);
  return y + 58;
}

function drawTimelineRow(ctx: any, y: number, time: string, text: string): number {
  ctx.font = '26px sans-serif';
  ctx.fillStyle = C_T3;
  ctx.fillText(time, PAD, y);
  ctx.fillStyle = C_T1;
  ctx.fillText(ellipsis(text, W - PAD * 2 - 110), PAD + 110, y);
  return y + 42;
}

function drawFooter(ctx: any, y: number): number {
  ctx.font = '22px sans-serif';
  ctx.fillStyle = C_T3;
  const text = '由「宝宝喂养记录」小程序生成';
  ctx.fillText(text, (W - ctx.measureText(text).width) / 2, y);
  return y + 60;
}

function ellipsis(text: string, maxWidth: number): string {
  // 简单按字符数截断（中文场景 1 字符 ≈ 26px）
  const maxChars = Math.floor(maxWidth / 26);
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

function toTempFile(canvas: any): Promise<string> {
  return new Promise((resolve, reject) => {
    (Taro as any).canvasToTempFilePath({
      canvas,
      fileType: 'png',
      success: (res: { tempFilePath: string }) => resolve(res.tempFilePath),
      fail: (err: unknown) => reject(err)
    });
  });
}

// ===== 统计长图 =====
export interface StatsImageInput {
  babyName: string;
  dateRangeText: string;
  /** 近 7 天各类型次数（按次数降序） */
  typeStats: { label: string; count: number }[];
  /** 今日概览行 */
  todayLines: { label: string; value: string }[];
}

export async function buildStatsImage(input: StatsImageInput): Promise<string> {
  const rows = input.typeStats.slice(0, 12);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const height = Math.min(
    MAX_H,
    226 + 54 + rows.length * 58 + 30 + 54 + input.todayLines.length * 50 + 40 + 60
  );
  const { canvas, ctx } = setupCanvas(height);
  let y = drawHeader(ctx, '近 7 天喂养统计', `${input.babyName} · ${input.dateRangeText}`);
  y = drawSection(ctx, y, '各类型记录次数');
  rows.forEach((r) => {
    if (y + 58 < height - 100) y = drawBarRow(ctx, y, r.label, r.count, max);
  });
  y += 30;
  y = drawSection(ctx, y, '今日概览');
  input.todayLines.forEach((l) => {
    if (y + 50 < height - 100) y = drawKV(ctx, y, l.label, l.value);
  });
  drawFooter(ctx, height - 60);
  return toTempFile(canvas);
}

// ===== 交接班摘要图 =====
export interface HandoverImageInput {
  babyName: string;
  ageText: string;
  dateText: string;
  summaryLines: { label: string; value: string; accent?: boolean }[];
  timeline: { time: string; text: string }[];
}

export async function buildHandoverImage(input: HandoverImageInput): Promise<string> {
  const MAX_ROWS = 28;
  const rows = input.timeline.slice(0, MAX_ROWS);
  const truncated = input.timeline.length - rows.length;
  const height = Math.min(
    MAX_H,
    226 + 54 + input.summaryLines.length * 50 + 30 + 54 + rows.length * 42 + (truncated > 0 ? 42 : 0) + 20 + 60
  );
  const { canvas, ctx } = setupCanvas(height);
  let y = drawHeader(ctx, '今日交接班摘要', `${input.babyName} · ${input.ageText} · ${input.dateText}`);
  y = drawSection(ctx, y, '今日汇总');
  input.summaryLines.forEach((l) => {
    if (y + 50 < height - 100) y = drawKV(ctx, y, l.label, l.value, l.accent);
  });
  y += 30;
  y = drawSection(ctx, y, '记录明细');
  rows.forEach((r) => {
    if (y + 42 < height - 100) y = drawTimelineRow(ctx, y, r.time, r.text);
  });
  if (truncated > 0 && y + 42 < height - 100) {
    ctx.font = '24px sans-serif';
    ctx.fillStyle = C_T3;
    ctx.fillText(`……另有 ${truncated} 条，详见小程序`, PAD, y);
  }
  drawFooter(ctx, height - 60);
  return toTempFile(canvas);
}

// ===== 保存 / 分享 =====
export async function saveImageToAlbum(filePath: string): Promise<void> {
  try {
    await Taro.saveImageToPhotosAlbum({ filePath });
    Taro.showToast({ title: '已保存到相册', icon: 'success' });
  } catch (e) {
    const msg = (e as { errMsg?: string })?.errMsg || '';
    if (msg.includes('auth deny') || msg.includes('authorize') || msg.includes('permission')) {
      const res = await Taro.showModal({
        title: '需要相册权限',
        content: '保存长图需要「添加到相册」权限，请在设置中开启',
        confirmText: '去设置'
      });
      if (res.confirm) Taro.openSetting({});
    } else if (!msg.includes('cancel')) {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  }
}

/** 优先唤起微信分享图片面板，不支持时降级为保存相册 */
export async function shareOrSaveImage(filePath: string): Promise<void> {
  try {
    await (Taro as any).showShareImageMenu({ path: filePath });
  } catch {
    await saveImageToAlbum(filePath);
  }
}
