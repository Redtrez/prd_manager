<template>
  <div class="versions-container">
    <div class="header">
      <el-page-header @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3"> {{ $t('versions.title') }} </span>
        </template>
      </el-page-header>
    </div>
    <div class="toolbar">
      <el-button type="primary" @click="dialogVisible = true">{{ $t('versions.uploadVersion') }}</el-button>
    </div>

    <el-table :data="versions" style="width: 100%" v-loading="loading">
      <el-table-column prop="version" :label="$t('versions.version')" width="150" />
      <el-table-column prop="type" :label="$t('versions.type')" width="140" />
      <el-table-column prop="created_at" :label="$t('versions.uploadedAt')">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')">
        <template #default="scope">
          <el-button size="small" type="success" @click="handlePreview(scope.row)">{{ $t('common.preview') }}</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="$t('versions.uploadVersion')">
      <el-form :model="form" label-width="100px">
        <el-form-item :label="$t('versions.version')" required>
          <el-input v-model="form.version" placeholder="e.g., v1.0.0" />
        </el-form-item>
        <el-form-item :label="$t('versions.type')" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option :label="$t('versions.typeAxure')" value="axure" />
            <el-option :label="$t('versions.typeHtml')" value="html" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === 'html'" :label="$t('versions.entry')">
          <el-input v-model="form.entry" placeholder="index.html" />
        </el-form-item>
        <el-form-item :label="$t('versions.zipFile')" required>
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              {{ $t('versions.dropFile') }}
            </div>
            <template #tip>
              <div class="el-upload__tip">
                {{ $t('versions.tipZip') }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="handleUpload" :loading="uploading">{{ $t('common.upload') }}</el-button>
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
import { UploadFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const designId = route.params.id as string
const versions = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const uploading = ref(false)
const fileList = ref<any[]>([])

const form = reactive({
  version: '',
  type: 'axure',
  entry: ''
})

const fetchVersions = async () => {
  loading.value = true
  try {
    const response = await api.get(`/designs/${designId}/versions`)
    versions.value = response.data
  } catch (error) {
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file: any) => {
  fileList.value = [file]
}

const handleUpload = async () => {
  if (!form.version || fileList.value.length === 0) {
    ElMessage.warning(t('versions.fillRequired'))
    return
  }

  uploading.value = true
  const formData = new FormData()
  formData.append('version', form.version)
  formData.append('type', form.type)
  if (form.type === 'html') {
    formData.append('entry', (form.entry && form.entry.trim()) || 'index.html')
  }
  const f = fileList.value[0]
  formData.append('file', (f && (f.raw ?? f)) as Blob)

  try {
    await api.post(`/designs/${designId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    ElMessage.success(t('versions.uploadSuccess'))
    dialogVisible.value = false
    fetchVersions()
  } catch (error) {
    const msg = (error && (error as any).response && (error as any).response.data && (error as any).response.data.message) || t('common.failed')
    ElMessage.error(Array.isArray(msg) ? msg.join(', ') : msg)
  } finally {
    uploading.value = false
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('versions.deleteConfirm'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/designs/${designId}/versions/${row.id}`)
      ElMessage.success(t('common.success'))
      fetchVersions()
    } catch (error) {
      ElMessage.error(t('common.failed'))
    }
  })
}

const handlePreview = (row: any) => {
  if (row.path) {
    if (row.type === 'html') {
      window.open(row.path, '_blank')
      return
    }
    const previewUrl = `/preview?url=${encodeURIComponent(row.path)}&title=${encodeURIComponent(row.version)}`
    window.open(previewUrl, '_blank')
  } else {
    ElMessage.warning(t('common.failed'))
  }
}

const goBack = () => {
  router.back()
}

onMounted(fetchVersions)
</script>

<style scoped>
.versions-container {
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
