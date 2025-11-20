import { ref, createApp, h } from 'vue';
import Toast from '../components/Toast.vue';

const toasts = ref([]);
let toastIdCounter = 0;

// 自动识别消息类型
const detectType = (message) => {
  const msg = String(message).toLowerCase();
  
  // 成功类关键词
  if (
    msg.includes('成功') ||
    msg.includes('已创建') ||
    msg.includes('已更新') ||
    msg.includes('已删除') ||
    msg.includes('已保存') ||
    msg.includes('上传成功') ||
    msg.includes('更新成功') ||
    msg.includes('保存成功')
  ) {
    return 'success';
  }
  
  // 错误类关键词
  if (
    msg.includes('失败') ||
    msg.includes('错误') ||
    msg.includes('无法') ||
    msg.includes('不能') ||
    msg.includes('无效') ||
    msg.includes('缺失') ||
    msg.includes('不存在')
  ) {
    return 'error';
  }
  
  // 警告类关键词
  if (
    msg.includes('警告') ||
    msg.includes('注意') ||
    msg.includes('请') ||
    msg.includes('必须') ||
    msg.includes('需要')
  ) {
    return 'warning';
  }
  
  // 默认为信息类
  return 'info';
};

const showToast = (message, type = null, duration = 3000) => {
  const toastType = type || detectType(message);
  const id = `toast-${++toastIdCounter}`;
  
  const toast = {
    id,
    message,
    type: toastType,
    duration,
  };
  
  toasts.value.push(toast);
  
  // 自动移除
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
};

const removeToast = (id) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

const success = (message, duration = 3000) => {
  return showToast(message, 'success', duration);
};

const error = (message, duration = 3000) => {
  return showToast(message, 'error', duration);
};

const warning = (message, duration = 3000) => {
  return showToast(message, 'warning', duration);
};

const info = (message, duration = 3000) => {
  return showToast(message, 'info', duration);
};

const clear = () => {
  toasts.value = [];
};

export default {
  toasts,
  showToast,
  removeToast,
  success,
  error,
  warning,
  info,
  clear,
};

