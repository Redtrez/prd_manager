<template>
  <div class="projects-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">{{ $t('projects.createProject') }}</el-button>
    </div>

    <el-table :data="projects" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" :label="$t('projects.name')" width="200">
        <template #default="scope">
          <el-link type="primary" @click="goToVersions(scope.row.id)">{{ scope.row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="description" :label="$t('projects.description')" />
      <el-table-column prop="tags" :label="$t('projects.tags')">
        <template #default="scope">
          <el-tag v-for="tag in scope.row.tags" :key="tag" class="mr-1">{{ tag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" :label="$t('projects.createdAt')" width="180">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleDateString() }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? $t('projects.editProject') : $t('projects.createProject')">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('projects.name')" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('projects.description')">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item :label="$t('projects.tags')">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            :placeholder="$t('projects.addTags')"
          >
          </el-select>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const projects = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')

const form = reactive({
  name: '',
  description: '',
  tags: [] as string[]
})

const fetchProjects = async () => {
  loading.value = true
  try {
    const response = await api.get('/projects')
    projects.value = response.data
  } catch (error) {
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.description = ''
  form.tags = []
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  currentId.value = row.id
  form.name = row.name
  form.description = row.description
  form.tags = row.tags || []
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('projects.deleteConfirm'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/projects/${row.id}`)
      ElMessage.success(t('common.success'))
      fetchProjects()
    } catch (error) {
      ElMessage.error(t('common.failed'))
    }
  })
}

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await api.patch(`/projects/${currentId.value}`, form)
      ElMessage.success(t('common.success'))
    } else {
      await api.post('/projects', form)
      ElMessage.success(t('common.success'))
    }
    dialogVisible.value = false
    fetchProjects()
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const goToVersions = (id: string) => {
  router.push(`/projects/${id}/versions`)
}

onMounted(fetchProjects)
</script>

<style scoped>
.projects-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.toolbar {
  margin-bottom: 20px;
}

.mr-1 {
  margin-right: 4px;
}
</style>
