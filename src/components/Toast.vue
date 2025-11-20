<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
  },
  duration: {
    type: Number,
    default: 3000,
  },
  id: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close']);

let timer = null;

onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      handleClose();
    }, props.duration);
  }
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
});

const handleClose = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  emit('close', props.id);
};

const typeConfig = {
  success: {
    icon: '✓',
    bgColor: '#f0fdf4',
    borderColor: '#22c55e',
    textColor: '#15803d',
    iconBg: '#22c55e',
  },
  error: {
    icon: '✗',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    textColor: '#b91c1c',
    iconBg: '#ef4444',
  },
  warning: {
    icon: '⚠',
    bgColor: '#fffbeb',
    borderColor: '#f59e0b',
    textColor: '#b45309',
    iconBg: '#f59e0b',
  },
  info: {
    icon: 'ℹ',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    textColor: '#1e40af',
    iconBg: '#3b82f6',
  },
};

const config = typeConfig[props.type] || typeConfig.info;
</script>

<template>
  <div class="toast" :class="`toast--${type}`" @click="handleClose">
    <div class="toast__icon" :style="{ backgroundColor: config.iconBg }">
      {{ config.icon }}
    </div>
    <div class="toast__content">
      <p class="toast__message">{{ message }}</p>
    </div>
    <button class="toast__close" @click.stop="handleClose" aria-label="关闭">×</button>
  </div>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  max-width: 500px;
  padding: 1rem 1.25rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
  border-left: 4px solid;
  cursor: pointer;
  transition: transform 0.3s ease, opacity 0.3s ease;
  animation: slideIn 0.3s ease;
}

.toast:hover {
  transform: translateX(-4px);
}

.toast--success {
  border-left-color: #22c55e;
}

.toast--error {
  border-left-color: #ef4444;
}

.toast--warning {
  border-left-color: #f59e0b;
}

.toast--info {
  border-left-color: #3b82f6;
}

.toast__icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 1.1rem;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
}

.toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.toast__close:hover {
  color: #0f172a;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .toast {
    min-width: 280px;
    max-width: calc(100vw - 2rem);
    padding: 0.875rem 1rem;
  }

  .toast__icon {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }

  .toast__message {
    font-size: 0.9rem;
  }
}
</style>

