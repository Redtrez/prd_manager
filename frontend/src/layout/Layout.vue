<template>
  <el-container class="layout-container">
    <el-header class="top-nav">
      <div class="nav-content">
        <div class="logo">PRD Manager</div>
        <el-menu
          mode="horizontal"
          :router="true"
          :default-active="$route.path"
          class="nav-menu"
          :ellipsis="false"
        >
          <el-menu-item index="/projects">{{ $t('layout.projects') }}</el-menu-item>
          <el-menu-item index="/announcements">{{ $t('layout.announcements') }}</el-menu-item>
          <el-menu-item v-if="authStore.user?.role === 'ADMIN'" index="/users">{{ $t('layout.users') }}</el-menu-item>
        </el-menu>
        <div class="right-actions">
          <el-dropdown @command="handleLanguageChange" class="lang-dropdown">
            <span class="el-dropdown-link">
              {{ currentLang === 'zh-cn' ? '中文' : 'English' }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh-cn">中文</el-dropdown-item>
                <el-dropdown-item command="en">English</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div class="user-info">
            <span class="username">{{ authStore.user?.username }}</span>
            <el-divider direction="vertical" />
            <el-button type="text" @click="handleLogout">{{ $t('common.logout') }}</el-button>
          </div>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <router-view />
    </el-main>

    <el-footer class="footer">
      <div class="footer-content">
        &copy; {{ new Date().getFullYear() }} PRD Manager. All rights reserved.
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const { locale } = useI18n()

const currentLang = computed(() => locale.value)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const handleLanguageChange = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.top-nav {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  width: 100%;
  max-width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  flex-shrink: 0;
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
  background-color: transparent;
  min-width: 0;
  overflow: hidden;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
  margin-right: 24px;
}

.lang-dropdown {
  cursor: pointer;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.username {
  color: #303133;
  font-size: 14px;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.footer {
  height: 60px;
  padding: 0;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.footer-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}
</style>
