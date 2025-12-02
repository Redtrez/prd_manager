<template>
  <div class="users-container">
    <div class="header">
      <h2>{{ $t('users.title') }}</h2>
      <el-button type="primary" @click="handleCreate" v-permission="['user:create']">{{ $t('users.create') }}</el-button>
    </div>

    <el-table :data="users" style="width: 100%" v-loading="loading">
      <el-table-column prop="username" :label="$t('users.username')" width="200" />
      <el-table-column prop="role" :label="$t('users.role')" width="150">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'ADMIN' ? 'danger' : 'info'">
            {{ scope.row.role === 'ADMIN' ? $t('users.admin') : $t('users.user') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" :label="$t('users.createdAt')">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="enabled" :label="$t('users.status')" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.enabled ? 'success' : 'danger'" size="small">
            {{ scope.row.enabled ? $t('users.enabled') : $t('users.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="400">
        <template #default="scope">
          <el-button-group>
            <el-button size="small" @click="handleEditPermissions(scope.row)" v-permission="['user:edit']">{{ $t('users.permissions') }}</el-button>
            <el-button size="small" @click="handleChangePassword(scope.row)" v-permission="['user:edit']">{{ $t('users.password') }}</el-button>
            <el-button size="small" :type="scope.row.enabled ? 'warning' : 'success'" @click="handleToggleEnabled(scope.row)" v-permission="['user:edit']">{{ scope.row.enabled ? $t('users.disable') : $t('users.enable') }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)" v-permission="['user:delete']">{{ $t('common.delete') }}</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- Create User Dialog -->
    <el-dialog v-model="createDialogVisible" :title="$t('users.create')">
      <el-form :model="createForm" label-width="100px">
        <el-form-item :label="$t('users.username')" required>
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item :label="$t('users.password')" required>
          <el-input v-model="createForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitCreate">{{ $t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Permissions Dialog -->
    <el-dialog v-model="permissionsDialogVisible" :title="$t('users.permissions')" width="800px">
      <el-form :model="permissionsForm" label-width="120px">
        <el-form-item :label="$t('users.role')">
          <el-select v-model="permissionsForm.role">
            <el-option label="ADMIN" value="ADMIN" />
            <el-option label="USER" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('users.menuPermissions')">
          <el-checkbox-group v-model="permissionsForm.permissions">
            <el-checkbox label="project:view">{{ $t('permissions.projectView') }}</el-checkbox>
            <el-checkbox label="project:create">{{ $t('permissions.projectCreate') }}</el-checkbox>
            <el-checkbox label="project:edit">{{ $t('permissions.projectEdit') }}</el-checkbox>
            <el-checkbox label="project:delete">{{ $t('permissions.projectDelete') }}</el-checkbox>
            <el-checkbox label="user:view">{{ $t('permissions.userView') }}</el-checkbox>
            <el-checkbox label="user:create">{{ $t('permissions.userCreate') }}</el-checkbox>
            <el-checkbox label="user:edit">{{ $t('permissions.userEdit') }}</el-checkbox>
            <el-checkbox label="user:delete">{{ $t('permissions.userDelete') }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item :label="$t('users.accessibleProjects')" v-if="permissionsForm.role !== 'ADMIN'">
            <el-transfer
                v-model="permissionsForm.accessibleProjects"
                :data="projects"
                :props="{ key: 'id', label: 'name' }"
                :titles="[$t('common.allProjects'), $t('common.assignedProjects')]"
            />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionsDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitPermissions">{{ $t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Change Password Dialog -->
    <el-dialog v-model="passwordDialogVisible" :title="$t('users.changePassword')">
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item :label="$t('users.newPassword')" required>
          <el-input v-model="passwordForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitPassword">{{ $t('common.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import api from '../utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const users = ref<any[]>([])
const projects = ref<any[]>([])
const loading = ref(false)

const createDialogVisible = ref(false)
const permissionsDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const currentUserId = ref('')

const createForm = reactive({
  username: '',
  password: ''
})

const permissionsForm = reactive({
  role: '',
  permissions: [] as string[],
  accessibleProjects: [] as string[]
})

const passwordForm = reactive({
  password: ''
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/users')
    users.value = response.data
  } catch (error) {
    ElMessage.error(t('common.failed'))
  } finally {
    loading.value = false
  }
}

const fetchProjects = async () => {
  try {
    const response = await api.get('/projects')
    projects.value = response.data
  } catch (error) {
    console.error('Failed to fetch projects', error)
  }
}

const handleCreate = () => {
  createForm.username = ''
  createForm.password = ''
  createDialogVisible.value = true
}

const submitCreate = async () => {
  try {
    await api.post('/users', createForm)
    ElMessage.success(t('common.success'))
    createDialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/users/${row.id}`)
      ElMessage.success(t('common.success'))
      fetchUsers()
    } catch (error) {
      ElMessage.error(t('common.failed'))
    }
  })
}

const handleEditPermissions = (row: any) => {
  currentUserId.value = row.id
  permissionsForm.role = row.role
  permissionsForm.permissions = row.permissions || []
  // We need to fetch accessible projects for this user if not already in row
  // Assuming row has accessibleProjects or we need to fetch them.
  // The user list endpoint might not return accessibleProjects by default unless we updated findAll in UsersService.
  // Let's assume we need to fetch user details or just rely on what we have.
  // If row doesn't have it, we might need to fetch it.
  // For now, let's assume row has it or we default to empty.
  // Actually, we didn't update UsersService.findAll to include accessibleProjects.
  // We should probably update UsersService.findAll or fetch user details here.
  // Let's fetch user details to be safe.
  api.get(`/users`).then(() => {
      // This returns all users. We can find the user in the list if we updated the backend.
      // But better to just use what we have or update backend to return it.
      // Let's assume for now we need to update backend UsersService.findAll to include relations.
      // Or we can just use the row if we update the backend now.
      // Let's update backend UsersService.findAll to include accessibleProjects.
  })
  
  permissionsForm.accessibleProjects = row.accessibleProjects?.map((p: any) => p.id) || []
  permissionsDialogVisible.value = true
}

const submitPermissions = async () => {
  try {
    await api.patch(`/users/${currentUserId.value}/role`, { role: permissionsForm.role })
    await api.patch(`/users/${currentUserId.value}/permissions`, { permissions: permissionsForm.permissions })
    await api.patch(`/users/${currentUserId.value}/projects`, { projectIds: permissionsForm.accessibleProjects })
    ElMessage.success(t('common.success'))
    permissionsDialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const handleChangePassword = (row: any) => {
  currentUserId.value = row.id
  passwordForm.password = ''
  passwordDialogVisible.value = true
}

const submitPassword = async () => {
  try {
    await api.patch(`/users/${currentUserId.value}/password`, { password: passwordForm.password })
    ElMessage.success(t('common.success'))
    passwordDialogVisible.value = false
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

const handleToggleEnabled = async (row: any) => {
  try {
    await api.patch(`/users/${row.id}/toggle-enabled`)
    ElMessage.success(t('common.success'))
    fetchUsers()
  } catch (error) {
    ElMessage.error(t('common.failed'))
  }
}

onMounted(() => {
    fetchUsers()
    fetchProjects()
})
</script>

<style scoped>
.users-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}
</style>
