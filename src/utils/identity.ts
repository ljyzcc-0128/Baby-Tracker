// ============================================
// 用户身份标识
// - clientId：本地生成的设备标识，任何模式都可用
// - openid：通过云函数 getOpenId 获取（需开通云开发），
//   未开通时自动降级返回 null，不影响正常使用
// ============================================
import Taro from '@tarojs/taro';
import { getStorage, setStorage } from './storage';

const KEY_CLIENT_ID = 'bt_client_id';
const KEY_OPENID = 'bt_openid';

/** 云开发环境 ID */
export const CLOUD_ENV_ID = 'cloud1-d9gcr014e55663d98';

/** 云开发是否已配置（未配置时不初始化，避免控制台报错） */
export const cloudEnabled =
  !!CLOUD_ENV_ID && !CLOUD_ENV_ID.startsWith('YOUR_');

function genUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** 本地设备标识：无需任何授权，游客模式也可用 */
export function getClientId(): string {
  let id = getStorage<string>(KEY_CLIENT_ID, '');
  if (!id) {
    id = genUuid();
    setStorage(KEY_CLIENT_ID, id);
  }
  return id;
}

/**
 * 获取并缓存 openid
 * 依赖：正式 AppID + 已开通云开发 + 已部署 getOpenId 云函数
 * 任何一步不满足都返回 null（静默降级）
 */
export async function ensureOpenId(): Promise<string | null> {
  const cached = getStorage<string>(KEY_OPENID, '');
  if (cached) return cached;
  try {
    const res = await Taro.cloud.callFunction({ name: 'getOpenId' });
    const openid = (res.result as { openid?: string } | undefined)?.openid;
    if (openid) {
      setStorage(KEY_OPENID, openid);
      console.log('[identity] openid:', openid);
      return openid;
    }
    return null;
  } catch {
    return null;
  }
}
