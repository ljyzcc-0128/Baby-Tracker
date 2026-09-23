import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useStore } from './store/useStore';
// 全局样式
import './app.scss';

function App(props) {
  // 启动时从本地存储恢复数据
  useEffect(() => {
    useStore.getState().hydrate();
  }, []);

  // 对应 onShow
  useDidShow(() => {});

  // 对应 onHide
  useDidHide(() => {});

  return props.children;
}

export default App;
