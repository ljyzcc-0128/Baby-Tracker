import React, { useEffect } from 'react';
import Taro, { useDidShow, useDidHide } from '@tarojs/taro';
import { useStore } from './store/useStore';
import { cloudEnabled, CLOUD_ENV_ID, ensureOpenId } from './utils/identity';
// 全局样式
import './app.scss';

function App(props) {
  // 启动时从本地存储恢复数据
  useEffect(() => {
    useStore.getState().hydrate();
    // 初始化云开发并记录 openid（未开通云开发时静默跳过）
    if (cloudEnabled && Taro.cloud) {
      try {
        Taro.cloud.init({ env: CLOUD_ENV_ID, traceUser: true });
        ensureOpenId();
      } catch (e) {
        console.warn('[identity] cloud init failed:', e);
      }
    }
  }, []);

  // 对应 onShow
  useDidShow(() => {});

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
