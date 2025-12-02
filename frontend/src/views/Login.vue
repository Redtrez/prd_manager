<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-header">
        <h1 class="app-title">PRD Manager</h1>
        <p class="app-subtitle">Professional Prototype Management Platform</p>
      </div>
      <el-card class="login-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2>{{ isLogin ? $t('loginPage.titleLogin') : $t('loginPage.titleRegister') }}</h2>
          </div>
        </template>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="0px" size="large">
          <el-form-item prop="username">
            <el-input v-model="form.username" :placeholder="$t('common.username')" prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" :placeholder="$t('common.password')" prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item v-if="!isLogin" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" :placeholder="$t('common.confirmPassword')" prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" class="w-100 submit-btn" @click="handleSubmit" :loading="loading">
              {{ isLogin ? $t('common.login') : $t('common.register') }}
            </el-button>
          </el-form-item>
          <div class="text-center">
            <el-link type="primary" @click="toggleMode" :underline="false">
              {{ isLogin ? $t('loginPage.noAccount') : $t('loginPage.hasAccount') }}
            </el-link>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import api from '../utils/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const isLogin = ref(true)
const loading = ref(false)
const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const rules = computed(() => ({
  username: [{ required: true, message: t('common.username') + ' ' + t('common.failed'), trigger: 'blur' }],
  password: [{ required: true, message: t('common.password') + ' ' + t('common.failed'), trigger: 'blur' }],
  confirmPassword: [{ required: true, message: t('common.confirmPassword') + ' ' + t('common.failed'), trigger: 'blur' }]
}))

const toggleMode = () => {
  isLogin.value = !isLogin.value
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        if (isLogin.value) {
          await authStore.login({ username: form.username, password: form.password })
          ElMessage.success(t('loginPage.loginSuccess'))
        } else {
          if (form.password !== form.confirmPassword) {
            ElMessage.error(t('loginPage.passwordMismatch'))
            loading.value = false
            return
          }
          await api.post('/auth/register', { username: form.username, password: form.password })
          ElMessage.success(t('loginPage.registerSuccess'))
          toggleMode()
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || t('common.failed'))
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-content {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-title {
  font-size: 32px;
  color: #303133;
  margin: 0 0 10px;
  font-weight: 600;
}

.app-subtitle {
  color: #606266;
  margin: 0;
  font-size: 16px;
}

.login-card {
  border-radius: 8px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.w-100 {
  width: 100%;
}

.submit-btn {
  font-weight: 600;
  letter-spacing: 1px;
}

.text-center {
  text-align: center;
  margin-top: 10px;
}
</style>
