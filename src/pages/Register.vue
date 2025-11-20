<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerAccount } from '../services/api';
import { useAuthStore } from '../services/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  studentId: '',
  phone: '',
  college: '',
  major: '',
});

const loading = ref(false);
const message = ref('');
const fieldErrors = reactive({});
const touched = reactive({});

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = form.password;
  if (!pwd) return { level: 0, text: '', color: '' };
  
  let strength = 0;
  if (pwd.length >= 6) strength++;
  if (pwd.length >= 8) strength++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
  if (/\d/.test(pwd)) strength++;
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
  
  if (strength <= 2) return { level: 1, text: '弱', color: '#ef4444' };
  if (strength <= 3) return { level: 2, text: '中', color: '#f59e0b' };
  return { level: 3, text: '强', color: '#10b981' };
});

// 密码确认匹配状态
const passwordMatch = computed(() => {
  if (!form.confirmPassword) return null;
  return form.password === form.confirmPassword;
});

// 字段验证
const validateField = (field, value) => {
  switch (field) {
    case 'username':
      if (!value) return '账号不能为空';
      if (value.length < 3) return '账号至少 3 个字符';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return '账号只能包含字母、数字和下划线';
      break;
    case 'password':
      if (!value) return '密码不能为空';
      if (value.length < 6) return '密码至少 6 位';
      break;
    case 'confirmPassword':
      if (!value) return '请确认密码';
      if (value !== form.password) return '两次输入的密码不一致';
      break;
    case 'name':
      if (!value) return '姓名不能为空';
      break;
    case 'studentId':
      if (!value) return '学号不能为空';
      if (!/^\d+$/.test(value)) return '学号只能包含数字';
      break;
    case 'phone':
      if (value && !/^1[3-9]\d{9}$/.test(value)) return '请输入正确的手机号';
      break;
  }
  return '';
};

const handleBlur = (field) => {
  touched[field] = true;
  const error = validateField(field, form[field]);
  if (error) {
    fieldErrors[field] = error;
  } else {
    delete fieldErrors[field];
  }
};

const handleInput = (field) => {
  if (touched[field]) {
    const error = validateField(field, form[field]);
    if (error) {
      fieldErrors[field] = error;
    } else {
      delete fieldErrors[field];
    }
  }
};

const handleSubmit = async () => {
  // 标记所有字段为已触摸
  Object.keys(form).forEach(key => {
    touched[key] = true;
    const error = validateField(key, form[key]);
    if (error) {
      fieldErrors[key] = error;
    } else {
      delete fieldErrors[key];
    }
  });

  // 检查必填字段
  if (!form.username || !form.password || !form.name || !form.studentId) {
    message.value = '请填写所有必填字段';
    return;
  }

  // 检查字段错误
  if (Object.keys(fieldErrors).length > 0) {
    message.value = '请修正表单中的错误';
    return;
  }

  if (form.password !== form.confirmPassword) {
    message.value = '两次输入的密码不一致';
    return;
  }

  loading.value = true;
  message.value = '';
  
  try {
    const payload = {
      username: form.username,
      password: form.password,
      name: form.name,
      studentId: form.studentId,
      phone: form.phone,
      college: form.college,
      major: form.major,
    };
    const data = await registerAccount(payload);
    authStore.setSession(data);
    router.replace({ name: 'EventList' });
  } catch (err) {
    message.value = err.response?.data?.message || '注册失败，请稍后再试';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>注册新账号</h2>
        <p class="register-subtitle">填写基础信息即可创建学生账号，管理员请使用预置账号登录。</p>
      </div>

      <form class="register-form" @submit.prevent="handleSubmit">
        <!-- 账号信息分组 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">🔐</span>
            <h3>账号信息</h3>
          </div>
          <div class="form-grid">
            <div class="form-field" :class="{ 'has-error': fieldErrors.username }">
              <label>
                账号 <span class="required">*</span>
              </label>
              <input
                v-model="form.username"
                type="text"
                placeholder="用于登录的账号（至少3个字符）"
                @blur="handleBlur('username')"
                @input="handleInput('username')"
              />
              <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
            </div>

            <div class="form-field" :class="{ 'has-error': fieldErrors.password }">
              <label>
                密码 <span class="required">*</span>
              </label>
              <input
                v-model="form.password"
                type="password"
                placeholder="至少 6 位，建议包含大小写字母和数字"
                @blur="handleBlur('password')"
                @input="handleInput('password')"
              />
              <div v-if="form.password" class="password-strength">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :style="{
                      width: `${(passwordStrength.level / 3) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }"
                  ></div>
                </div>
                <span class="strength-text" :style="{ color: passwordStrength.color }">
                  密码强度：{{ passwordStrength.text }}
                </span>
              </div>
              <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
            </div>

            <div class="form-field" :class="{ 'has-error': fieldErrors.confirmPassword }">
              <label>
                确认密码 <span class="required">*</span>
              </label>
              <input
                v-model="form.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                @blur="handleBlur('confirmPassword')"
                @input="handleInput('confirmPassword')"
              />
              <span
                v-if="form.confirmPassword && passwordMatch !== null"
                class="match-hint"
                :class="{ 'match-success': passwordMatch, 'match-error': !passwordMatch }"
              >
                {{ passwordMatch ? '✓ 密码匹配' : '✗ 密码不匹配' }}
              </span>
              <span v-if="fieldErrors.confirmPassword" class="field-error">{{ fieldErrors.confirmPassword }}</span>
            </div>
          </div>
        </div>

        <!-- 个人信息分组 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-icon">👤</span>
            <h3>个人信息</h3>
          </div>
          <div class="form-grid">
            <div class="form-field" :class="{ 'has-error': fieldErrors.name }">
              <label>
                姓名 <span class="required">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="请输入真实姓名"
                @blur="handleBlur('name')"
                @input="handleInput('name')"
              />
              <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
            </div>

            <div class="form-field" :class="{ 'has-error': fieldErrors.studentId }">
              <label>
                学号 <span class="required">*</span>
              </label>
              <input
                v-model="form.studentId"
                type="text"
                placeholder="例如：20230001"
                @blur="handleBlur('studentId')"
                @input="handleInput('studentId')"
              />
              <span v-if="fieldErrors.studentId" class="field-error">{{ fieldErrors.studentId }}</span>
            </div>

            <div class="form-field" :class="{ 'has-error': fieldErrors.college }">
              <label>学院</label>
              <input
                v-model="form.college"
                type="text"
                placeholder="例如：计算机学院"
                @blur="handleBlur('college')"
                @input="handleInput('college')"
              />
              <span v-if="fieldErrors.college" class="field-error">{{ fieldErrors.college }}</span>
            </div>

            <div class="form-field" :class="{ 'has-error': fieldErrors.major }">
              <label>专业</label>
              <input
                v-model="form.major"
                type="text"
                placeholder="例如：软件工程"
                @blur="handleBlur('major')"
                @input="handleInput('major')"
              />
              <span v-if="fieldErrors.major" class="field-error">{{ fieldErrors.major }}</span>
            </div>

            <div class="form-field" :class="{ 'has-error': fieldErrors.phone }">
              <label>联系电话</label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="11 位手机号（可选）"
                @blur="handleBlur('phone')"
                @input="handleInput('phone')"
              />
              <span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span>
            </div>
          </div>
        </div>

        <!-- 提交区域 -->
        <div class="form-actions">
          <div v-if="message" class="form-message" :class="{ 'message-error': message.includes('失败') || message.includes('错误') }">
            {{ message }}
          </div>
          <button class="btn-primary btn-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="btn-loading">⏳</span>
            {{ loading ? '注册中...' : '注册并登录' }}
          </button>
          <RouterLink to="/login" class="auth-link">
            已有账号？<span>去登录</span>
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.register-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.1);
  padding: 2.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.register-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.register-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.register-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

.section-icon {
  font-size: 1.5rem;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.form-field input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #ffffff;
}

.form-field input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-field.has-error input {
  border-color: #ef4444;
}

.form-field.has-error input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.field-error {
  font-size: 0.85rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-text {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.match-hint {
  font-size: 0.85rem;
  font-weight: 500;
}

.match-success {
  color: #10b981;
}

.match-error {
  color: #ef4444;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.form-message {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  text-align: center;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.form-message.message-error {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.btn-submit {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.auth-link {
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.auth-link:hover {
  color: #3b82f6;
}

.auth-link span {
  color: #3b82f6;
  font-weight: 500;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .register-container {
    padding: 1rem;
  }

  .register-card {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .register-header h2 {
    font-size: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-section {
    gap: 1rem;
  }

  .section-header {
    padding-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 1.25rem;
  }

  .register-header {
    margin-bottom: 1.5rem;
  }

  .register-form {
    gap: 1.5rem;
  }
}
</style>
