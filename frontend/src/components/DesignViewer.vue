<template>
  <div class="design-viewer">
    <div class="viewer-header">
      <h3>{{ title }}</h3>
      <div class="viewer-controls">
        <el-button-group class="tool-group">
          <el-button size="small" :type="currentTool === 'select' ? 'primary' : 'default'" @click="toggleTool('select')">
            <el-icon><pointer /></el-icon>
          </el-button>
          <el-button size="small" :type="currentTool === 'pan' ? 'primary' : 'default'" @click="toggleTool('pan')">
            <el-icon><rank /></el-icon>
          </el-button>
        </el-button-group>
        <el-divider direction="vertical" />
        <el-button-group>
          <el-button size="small" @click="zoomIn">
            <el-icon><zoom-in /></el-icon>
          </el-button>
          <el-button size="small" @click="zoomOut">
            <el-icon><zoom-out /></el-icon>
          </el-button>
          <el-button size="small" @click="resetZoom">
            <el-icon><refresh /></el-icon>
          </el-button>
        </el-button-group>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      </div>
    </div>
    <div 
      class="viewer-content" 
      ref="viewerContent"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @wheel="handleWheel"
      :style="{ cursor: (currentTool === 'pan' || isSpacePressed) ? (isDragging ? 'grabbing' : 'grab') : 'default' }"
    >
      <iframe 
        ref="iframe"
        :src="src" 
        :style="{
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: '0 0',
          pointerEvents: (currentTool === 'pan' || isSpacePressed) ? 'none' : 'auto'
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ZoomIn, ZoomOut, Refresh, Pointer, Rank } from '@element-plus/icons-vue'

interface Props {
  src: string
  title: string
}

defineProps<Props>()

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const lastTranslateX = ref(0)
const lastTranslateY = ref(0)

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.1, 3)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.1, 0.1)
}

const resetZoom = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

const currentTool = ref<'pan' | 'select'>('select')

const toggleTool = (tool: 'pan' | 'select') => {
  currentTool.value = tool
}

const isSpacePressed = ref(false)

const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && !e.repeat) {
    isSpacePressed.value = true
  }
}

const handleKeyup = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    isSpacePressed.value = false
    isDragging.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
})

const startDrag = (e: MouseEvent) => {
  if (currentTool.value !== 'pan' && !isSpacePressed.value) return
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  lastTranslateX.value = translateX.value
  lastTranslateY.value = translateY.value
}

const drag = (e: MouseEvent) => {
  if (!isDragging.value) return
  
  const deltaX = (e.clientX - dragStartX.value) / scale.value
  const deltaY = (e.clientY - dragStartY.value) / scale.value
  
  translateX.value = lastTranslateX.value + deltaX
  translateY.value = lastTranslateY.value + deltaY
}

const endDrag = () => {
  isDragging.value = false
}

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    if (e.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }
}
</script>

<style scoped>
.design-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f7fa;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
}

.viewer-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.viewer-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-level {
  font-size: 14px;
  color: #606266;
  min-width: 50px;
  text-align: right;
}

.viewer-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #e4e7ed;
}

.viewer-content iframe {
  width: 100%;
  height: 100%;
  border: none;
  background-color: #fff;
}
</style>
