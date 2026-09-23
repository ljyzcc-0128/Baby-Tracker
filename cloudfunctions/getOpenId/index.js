// 云函数：获取调用者的 openid
// 部署方式：微信开发者工具中右键 cloudfunctions/getOpenId -> 上传并部署（云端安装依赖）
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    unionid: wxContext.UNIONID || '',
    appid: wxContext.APPID
  };
};
