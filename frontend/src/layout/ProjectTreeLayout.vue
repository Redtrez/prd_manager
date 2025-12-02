<template>
  <div class="project-tree-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>{{ $t('projects.title') }}</h3>
      </div>
      <el-input
        v-model="filterText"
        :placeholder="$t('common.search')"
        class="filter-input"
      />
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="defaultProps"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
        default-expand-all
        highlight-current
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span>
                <el-icon v-if="data.type === 'project'"><Folder /></el-icon>
                <el-icon v-else-if="data.type === 'productVersion'"><Collection /></el-icon>
                <el-icon v-else-if="data.type === 'design'"><Document /></el-icon>
                <span class="node-label">{{ node.label }}</span>
            </span>
          </span>
        </template>
      </el-tree>
    </div>
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'
import { ElTree } from 'element-plus'
import { Folder, Collection, Document } from '@element-plus/icons-vue'

interface TreeData {
  id: string
  label: string
  type: 'project' | 'productVersion' | 'design'
  children?: TreeData[]
  originalData?: any
}

const router = useRouter()
const filterText = ref('')
const treeRef = ref<InstanceType<typeof ElTree>>()
const treeData = ref<TreeData[]>([])

const defaultProps = {
  children: 'children',
  label: 'label',
}

watch(filterText, (val) => {
  treeRef.value!.filter(val)
})

const filterNode = (value: string, data: any) => {
  if (!value) return true
  const treeData = data as TreeData
  return treeData.label.toLowerCase().includes(value.toLowerCase())
}

const fetchProjects = async () => {
  try {
    const response = await api.get('/projects')
    treeData.value = transformData(response.data)
  } catch (error) {
    console.error('Failed to fetch projects', error)
  }
}

const transformData = (projects: any[]): TreeData[] => {
  return projects.map(project => ({
    id: project.id,
    label: project.name,
    type: 'project',
    children: project.productVersions?.map((pv: any) => ({
      id: pv.id,
      label: pv.version,
      type: 'productVersion',
      originalData: { ...pv, productId: project.id },
      children: pv.designs?.map((design: any) => ({
        id: design.id,
        label: design.name,
        type: 'design',
        originalData: design
      }))
    }))
  }))
}

const handleNodeClick = (data: TreeData, node: any) => {
  // Toggle expand/collapse
  if (!node.isLeaf) {
    node.expanded = !node.expanded
  }

  if (data.type === 'project') {
    // Navigate to product versions list for this project
    router.push(`/projects/${data.id}/versions`)
  } else if (data.type === 'productVersion') {
    // Navigate to designs list for this version
    // Route: /product-versions/:id/designs
    router.push(`/product-versions/${data.id}/designs`)
  } else if (data.type === 'design') {
    // Navigate to design versions (preview page)
    router.push(`/designs/${data.id}/versions`)
  }
}

onMounted(fetchProjects)
</script>

<style scoped>
.project-tree-layout {
  display: flex;
  height: calc(100vh - 60px); /* Adjust based on header height */
}

.sidebar {
  width: 300px;
  border-right: 1px solid #e6e6e6;
  padding: 20px;
  overflow-y: auto;
  background-color: #fff;
}

.sidebar-header {
  margin-bottom: 20px;
}

.filter-input {
  margin-bottom: 20px;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.custom-tree-node {
  display: flex;
  align-items: center;
}

.node-label {
  margin-left: 8px;
}
</style>
