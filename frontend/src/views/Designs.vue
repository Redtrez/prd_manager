<template>
  <div class="designs-container">
    <div class="header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3">{{ $t('designs.title') }}</span>
        </template>
      </el-page-header>
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="dialogVisible = true">{{ $t('designs.createDesign') }}</el-button>
    </div>

    <el-table :data="designs" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" :label="$t('designs.name')" />
      <el-table-column prop="description" :label="$t('designs.description')" />
      <el-table-column prop="created_at" :label="$t('designs.createdAt')">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewVersions(scope.row)">{{ $t('designs.viewVersions') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="$t('designs.createDesign')">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('designs.name')" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('designs.description')">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleCreate">{{ $t('common.create') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const versionId = route.params.id as string
const designs = ref([])
const loading = ref(false)
const dialogVisible = ref(false)

const form = reactive({
  name: '',
  description: ''
})

const fetchDesigns = async () => {
  loading.value = true
  try {
    const response = await api.get(`/product-versions/${versionId}/designs`)
    designs.value = response.data
  } catch (error) {
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!form.name) {
    ElMessage.warning(t('common.fillRequired'))
    return
  }

  try {
    await api.post(`/product-versions/${versionId}/designs`, form)
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    form.name = ''
    form.description = ''
    fetchDesigns()
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('designs.deleteConfirm'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/product-versions/${versionId}/designs/${row.id}`)
      ElMessage.success(t('common.success'))
      fetchDesigns()
    } catch (error) {
      ElMessage.error(t('common.failed'))
    }
  })
}

const viewVersions = (design: any) => {
  router.push(`/designs/${design.id}/versions`)
}

const goBack = () => {
  router.back()
}

onMounted(fetchDesigns)
</script>

<style scoped>
.designs-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.toolbar {
  margin-bottom: 20px;
}
</style>
