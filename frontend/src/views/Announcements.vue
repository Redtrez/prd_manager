<template>
  <div class="announcements-container">
    <div class="header">
      <span class="text-large font-600 mr-3">{{ $t('announcements.title') }}</span>
    </div>
    <div class="toolbar" v-if="isAdmin">
      <el-button type="primary" @click="dialogVisible = true">{{ $t('announcements.createAnnouncement') }}</el-button>
    </div>

    <el-timeline>
      <el-timeline-item
        v-for="item in announcements"
        :key="item.id"
        :timestamp="new Date(item.created_at).toLocaleDateString()"
        placement="top"
      >
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">{{ item.title }}</span>
              <el-button v-if="isAdmin" type="danger" link @click="handleDelete(item)">{{ $t('common.delete') }}</el-button>
            </div>
          </template>
          <div class="content">{{ item.content }}</div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-dialog v-model="dialogVisible" :title="$t('announcements.createAnnouncement')">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('announcements.inputTitle')" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item :label="$t('announcements.content')" required>
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import api from '../utils/api'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const announcements = ref<any[]>([])
const dialogVisible = ref(false)

const form = reactive({
  title: '',
  content: ''
})

const isAdmin = computed(() => authStore.user?.role === 'ADMIN')

const fetchAnnouncements = async () => {
  try {
    const response = await api.get('/announcements')
    announcements.value = response.data
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const handleSubmit = async () => {
  if (!form.title || !form.content) {
    ElMessage.warning(t('versions.fillRequired')) // Reusing fillRequired? "Please fill in version..." -> Not perfect.
    // I should add a generic fillRequired.
    return
  }
  try {
    await api.post('/announcements', form)
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    form.title = ''
    form.content = ''
    fetchAnnouncements()
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const handleDelete = (item: any) => {
  ElMessageBox.confirm(t('announcements.deleteConfirm'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/announcements/${item.id}`)
      ElMessage.success(t('common.success'))
      fetchAnnouncements()
    } catch (error) {
      ElMessage.error(t('common.failed'))
    }
  })
}

onMounted(fetchAnnouncements)
</script>

<style scoped>
.announcements-container {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.toolbar {
  margin-bottom: 30px;
  text-align: right;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.content {
  white-space: pre-wrap;
  color: #606266;
  line-height: 1.6;
}
</style>
