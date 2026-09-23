// ============================================
// 通用 Canvas 折线图（生长曲线用）
// x 轴：月龄，y 轴：测量值；支持 WHO 参考虚线
// ============================================
import React, { useEffect } from 'react';
import { Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

export interface ChartPoint {
  x: number;
  y: number;
}

interface LineChartProps {
  /** 宝宝数据点（x=月龄） */
  points: ChartPoint[];
  /** 参考线（如 WHO P50） */
  refLine?: ChartPoint[];
  /** 宝宝曲线颜色 */
  color?: string;
  /** y 轴单位 */
  unit?: string;
  /** y 值小数位 */
  decimals?: number;
  dark?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  points,
  refLine,
  color = '#ff8c5a',
  unit = '',
  decimals = 1,
  dark
}) => {
  const query = Taro.createSelectorQuery();

  useEffect(() => {
    query
      .select('#growth-line-chart')
      .fields({ node: true, size: true })
      .exec((res: any) => {
        const info = res?.[0];
        if (!info || !info.node) return;
        draw(info.node, info.width, info.height);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, refLine, dark, color, unit, decimals]);

  const draw = (
    canvas: any,
    width: number,
    height: number
  ) => {
    const dpr = (Taro.getSystemInfoSync().pixelRatio as number) || 2;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const axisColor = dark ? '#7c766f' : '#a39e99';
    const gridColor = dark ? '#3a3d42' : '#f0e8e2';
    const refColor = dark ? '#8a8f98' : '#c0c4cc';
    const pad = { l: 42, r: 14, t: 14, b: 24 };
    const iw = width - pad.l - pad.r;
    const ih = height - pad.t - pad.b;

    const all = [...points, ...(refLine || [])];
    if (!all.length || iw <= 0 || ih <= 0) return;

    const xMax = Math.max(1, Math.ceil(Math.max(...all.map((p) => p.x))));
    let yMin = Math.min(...all.map((p) => p.y));
    let yMax = Math.max(...all.map((p) => p.y));
    if (yMax - yMin < 0.001) {
      yMin -= 1;
      yMax += 1;
    }
    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad;
    yMax += yPad;

    const px = (x: number) => pad.l + ((x - 0) / xMax) * iw;
    const py = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * ih;

    // 横向网格 + y 轴标签
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const rows = 4;
    for (let i = 0; i <= rows; i++) {
      const y = yMin + ((yMax - yMin) * i) / rows;
      const cy = py(y);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, cy);
      ctx.lineTo(width - pad.r, cy);
      ctx.stroke();
      ctx.fillStyle = axisColor;
      ctx.fillText(y.toFixed(decimals), pad.l - 6, cy);
    }

    // x 轴标签（月龄）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xStep = xMax <= 4 ? 1 : xMax <= 8 ? 2 : xMax <= 18 ? 3 : xMax <= 30 ? 6 : 12;
    for (let x = 0; x <= xMax; x += xStep) {
      ctx.fillStyle = axisColor;
      ctx.fillText(String(x), px(x), height - pad.b + 6);
    }
    ctx.fillStyle = axisColor;
    ctx.fillText('月龄', width - pad.r, height - pad.b + 6);

    // WHO 参考虚线
    if (refLine && refLine.length > 1) {
      ctx.strokeStyle = refColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      refLine.forEach((p, i) => {
        if (i === 0) ctx.moveTo(px(p.x), py(p.y));
        else ctx.lineTo(px(p.x), py(p.y));
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 宝宝曲线
    if (points.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(px(p.x), py(p.y));
        else ctx.lineTo(px(p.x), py(p.y));
      });
      ctx.stroke();
    }

    // 数据点
    ctx.fillStyle = color;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(px(p.x), py(p.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // 点上方数值（最多 12 个点才显示，避免拥挤）
    if (points.length <= 12) {
      ctx.fillStyle = axisColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      points.forEach((p) => {
        ctx.fillText(p.y.toFixed(decimals), px(p.x), py(p.y) - 6);
      });
    }

    // 单位标注在左上角
    if (unit) {
      ctx.fillStyle = axisColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(unit, pad.l + 4, 4);
    }
  };

  return (
    <Canvas
      type='2d'
      id='growth-line-chart'
      className={styles.chart}
      style={{ width: '100%', height: '440rpx' }}
    />
  );
};

export default LineChart;
