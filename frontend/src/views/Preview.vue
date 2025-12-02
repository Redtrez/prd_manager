<template>
  <div class="preview-container">
    <div class="preview-header">
      <h3>{{ previewTitle }}</h3>
      <div class="preview-controls">
        <button class="zoom-btn" @click="zoomIn">+</button>
        <button class="zoom-btn" @click="zoomOut">-</button>
        <button class="zoom-btn" @click="resetZoom">Reset</button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <span class="preview-hint">按住 Alt 键拖动 | Ctrl/Cmd + 滚轮缩放</span>
      </div>
    </div>
    
    <div 
      class="viewport"
      ref="viewportRef"
    >
      <div class="canvas-container">
        <iframe
          ref="iframeRef"
          :src="previewUrl"
          class="content-frame"
          @load="onIframeLoad"
          :style="{
            width: `${15360 / scale}px`,
            height: `${8640 / scale}px`,
            transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
            transformOrigin: '0 0'
          }"
        />
      </div>
      
      <!-- Overlay: transparent to iframe when Alt not pressed -->
      <div 
        class="interaction-overlay"
        @mousedown="startDrag"
        @mousemove="drag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        :style="{ 
          cursor: isAltPressed ? (isDragging ? 'grabbing' : 'grab') : 'default',
          pointerEvents: isAltPressed ? 'auto' : 'none'
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const previewUrl = computed(() => route.query.url as string || '')
const previewTitle = computed(() => route.query.title as string || 'Preview')
const iframeRef = ref<HTMLIFrameElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)

// Bridge state
const bridgeReady = ref(false)
const supervisorId = ref<number | null>(null)
const mutationObserver = ref<MutationObserver | null>(null)
const allowedOrigin = computed(() => {
  try {
    const url = previewUrl.value
    if (!url) return ''
    const u = new URL(url)
    return u.origin
  } catch {
    return ''
  }
})

// Zoom and pan state
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const isAltPressed = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const lastTranslateX = ref(0)
const lastTranslateY = ref(0)

// Zoom controls
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

// Continuously detect Alt key state via mousemove (works even when iframe has focus)
const handleMouseMove = (e: MouseEvent) => {
  isAltPressed.value = e.altKey
}

// Fallback keyboard handlers for when mouse is stationary
const handleKeydown = (e: KeyboardEvent) => {
  if (e.altKey) {
    isAltPressed.value = true
  }
}

const handleKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Alt') {
    isAltPressed.value = false
    isDragging.value = false
  }
}

// 定时主动检测 Alt 键状态 - 解决 iframe 内按键无法冒泡的问题
let altKeyCheckInterval: number | null = null
const startAltKeyPolling = () => {
  if (altKeyCheckInterval) return
  altKeyCheckInterval = window.setInterval(() => {
    try {
      const iframe = iframeRef.value
      if (iframe && iframe.contentWindow) {
        // 通过 message 从 iframe 获取状态(由 bridge 发送)
        // 这里只是备份,主要靠 bridge 的 viewer:modifiers 消息
      }
    } catch {}
  }, 50) // 每 50ms 检查一次,保持响应性
}

const stopAltKeyPolling = () => {
  if (altKeyCheckInterval) {
    clearInterval(altKeyCheckInterval)
    altKeyCheckInterval = null
  }
}

// Reset on window blur
const handleBlur = () => {
  isAltPressed.value = false
  isDragging.value = false
}

// 自动恢复焦点到 iframe
const restoreIframeFocus = () => {
  try {
    const iframe = iframeRef.value
    if (!iframe || !iframe.contentWindow) return
    
    // 尝试聚焦 iframe
    iframe.focus()
    iframe.contentWindow.focus()
    
    // 如果 iframe 内有可聚焦元素,聚焦到 body
    const doc = iframe.contentDocument
    if (doc && doc.body) {
      doc.body.focus()
    }
  } catch (e) {
    // 跨域可能失败，忽略
  }
}

// 添加 MutationObserver 监听 iframe 内容变化
const setupIframeMutationObserver = (iframeDoc: Document) => {
  // 清理旧的 observer
  if (mutationObserver.value) {
    mutationObserver.value.disconnect()
  }

  const observer = new MutationObserver((mutations) => {
    // 检查变化是否由我们的 bridge 注入引起,如果是则忽略
    const isBridgeInjection = mutations.some(m => 
      Array.from(m.addedNodes).some(node => 
        node instanceof HTMLElement && node.hasAttribute?.('data-viewer-bridge')
      )
    )
    
    if (isBridgeInjection) return
    
    // 检测到实际内容变化,延迟恢复焦点和 bridge
    setTimeout(() => {
      restoreIframeFocus()
      // 重新注入 bridge 代码（如果需要）
      const iframe = iframeRef.value
      if (iframe && iframe.contentWindow && !(iframe.contentWindow as any).__viewerBridgeInstalled) {
        // 重新触发加载逻辑以注入 bridge
        onIframeLoad()
      }
    }, 200)
  })
  
  observer.observe(iframeDoc.body, {
    childList: true,
    subtree: true
  })
  
  mutationObserver.value = observer
}

// Handle iframe load to attach event listeners to iframe content
const onIframeLoad = () => {
  try {
    const iframe = iframeRef.value
    if (!iframe || !iframe.contentWindow) return

    const iframeWindow = iframe.contentWindow
    
    // Remove existing listeners if any (just in case)
    iframeWindow.removeEventListener('keydown', handleKeydown)
    iframeWindow.removeEventListener('keyup', handleKeyup)
    iframeWindow.removeEventListener('mousemove', handleMouseMove)
    
    // Add listeners
    iframeWindow.addEventListener('keydown', handleKeydown)
    iframeWindow.addEventListener('keyup', handleKeyup)
    iframeWindow.addEventListener('mousemove', handleMouseMove)
    
    // Also listen for wheel events in iframe to support zooming
    iframeWindow.addEventListener('wheel', (e: WheelEvent) => {
      // Forward wheel events to our main handler
      // We need to construct a similar event or just call logic
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // We can't easily forward the event object because clientX/Y are relative to iframe
        // So we need to adjust coordinates
        const iframeRect = iframe.getBoundingClientRect()
        const simulatedEvent = {
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          deltaY: e.deltaY,
          preventDefault: () => e.preventDefault(),
          clientX: e.clientX + iframeRect.left,
          clientY: e.clientY + iframeRect.top,
          currentTarget: viewportRef.value // Pretend it happened on viewport
        }
        // Call our handler with simulated event
        // Note: handleWheel expects WheelEvent, we might need to cast or adjust handleWheel
      handleWheel(simulatedEvent as unknown as WheelEvent)
    }
    }, { passive: false })

    // Setup MutationObserver for auto-focus recovery
    try {
      const doc = iframe.contentDocument
      if (doc) {
        setupIframeMutationObserver(doc)
        // Initial focus
        restoreIframeFocus()
      }
    } catch (e) {
      // Cross-origin might fail
    }

    // Try to inject bridge for same-origin pages
    try {
      const doc = iframe.contentDocument
      if (doc) {
        const script = doc.createElement('script')
        script.type = 'text/javascript'
        script.setAttribute('data-viewer-bridge', 'true')  // 添加标记
        script.textContent = `
          (function(){
            function send(t,p){try{top.postMessage({type:t,payload:p},'*');}catch(e){}}
            function abs(win,x,y){var a={x:x,y:y},cur=win;try{while(cur&&cur!==cur.top){var fe=cur.frameElement;if(!fe)break;var r=fe.getBoundingClientRect();a.x+=r.left;a.y+=r.top;cur=cur.parent;}}catch(e){}return a;}
            function install(win){
              try{ if(win.__viewerBridgeInstalled) return; win.__viewerBridgeInstalled = true; }catch(e){}
              var rid=null,pan=false,last=null,sp=false,al=false;
              var kd=function(e){if(e.code==='Space'&&!e.repeat)sp=true;if(e.altKey)al=true;send('viewer:modifiers',{alt:e.altKey,ctrl:e.ctrlKey,meta:e.metaKey,space:sp});};
              var ku=function(e){if(e.code==='Space')sp=false;if(e.key==='Alt')al=false;send('viewer:modifiers',{alt:al,ctrl:e.ctrlKey,meta:e.metaKey,space:sp});};
              var wh=function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();var a=abs(win,e.clientX,e.clientY);send('viewer:wheel',{deltaY:e.deltaY,absX:a.x,absY:a.y});}};
              var md=function(e){if(e.button===1||sp||e.altKey){pan=true;var a=abs(win,e.clientX,e.clientY);send('viewer:pan-start',{absX:a.x,absY:a.y});}};
              var mm=function(e){if(!pan)return;var a=abs(win,e.clientX,e.clientY);last={absX:a.x,absY:a.y};if(rid)return;rid=win.requestAnimationFrame(function(){rid=null;if(last){send('viewer:pan-move',last);last=null;}})};
              var mu=function(e){if(!pan)return;pan=false;var a=abs(win,e.clientX,e.clientY);send('viewer:pan-end',{absX:a.x,absY:a.y});};
              win.addEventListener('keydown',kd,true);win.addEventListener('keyup',ku,true);
              win.addEventListener('wheel',wh,{passive:false});
              win.addEventListener('mousedown',md,true);win.addEventListener('mousemove',mm,true);win.addEventListener('mouseup',mu,true);
              if(win.document){win.document.addEventListener('keydown',kd,true);win.document.addEventListener('keyup',ku,true);}
            }
            function hook(el){try{if(el&&el.addEventListener){el.addEventListener('load',function(){try{install(el.contentWindow);}catch(e){}},true);} }catch(e){} try{if(el&&el.contentWindow)install(el.contentWindow);}catch(e){} }
            install(window);
            var fs=document.querySelectorAll('iframe');if(fs&&fs.forEach)fs.forEach(function(f){hook(f)});
            var mo=new MutationObserver(function(ms){ms.forEach(function(m){if(m.addedNodes)m.addedNodes.forEach(function(n){if(n.tagName==='IFRAME')hook(n)}); if(m.type==='attributes'&&m.attributeName==='src'&&m.target&&m.target.tagName==='IFRAME'){hook(m.target);} })});
            mo.observe(document.documentElement||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
            send('viewer-ready',{});
          })();
        `
        doc.head.appendChild(script)
      }
    } catch (e) {
      // Cross-origin, ignore injection
    }

    // Send handshake (child will reply if bridge is active)
    try {
      iframeWindow.postMessage({ type: 'viewer-handshake' }, allowedOrigin.value || '*')
    } catch {}

    // If no bridge ready within 1s, keep fallback behavior
    window.setTimeout(() => { /* noop: bridgeReady remains false for fallback */ }, 1000)
    startBridgeSupervisor()

  } catch (err) {
    console.warn('Cannot attach events to iframe (likely cross-origin):', err)
  }
}

onMounted(() => {
  window.addEventListener('message', handleBridgeMessage)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('blur', handleBlur)
  window.addEventListener('wheel', handleWheel, { passive: false })
  startAltKeyPolling()  // 启动 Alt 键轮询
})

onUnmounted(() => {
  window.removeEventListener('message', handleBridgeMessage)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('blur', handleBlur)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('wheel', handleWheel)
  stopBridgeSupervisor()
  stopAltKeyPolling()  // 停止 Alt 键轮询
  if (mutationObserver.value) {
    mutationObserver.value.disconnect()
    mutationObserver.value = null
  }
})

// Drag handlers
const startDrag = (e: MouseEvent) => {
  if (!isAltPressed.value) return
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  lastTranslateX.value = translateX.value
  lastTranslateY.value = translateY.value
}

const drag = (e: MouseEvent) => {
  if (!isDragging.value) return
  const dx = e.clientX - dragStartX.value
  const dy = e.clientY - dragStartY.value
  translateX.value = lastTranslateX.value + dx
  translateY.value = lastTranslateY.value + dy
}

const endDrag = () => {
  isDragging.value = false
}

// Wheel zoom (window-level to work even when iframe has focus)
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.1, Math.min(3, scale.value + delta))
    
    // Get viewport bounds
    const viewport = viewportRef.value
    if (!viewport) return
    
    const rect = viewport.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate adjustment to keep zoom centered on cursor
    const scaleRatio = newScale / scale.value
    translateX.value = mouseX - (mouseX - translateX.value) * scaleRatio
    translateY.value = mouseY - (mouseY - translateY.value) * scaleRatio
    
    scale.value = newScale
  }
}

// Bridge message handler
const handleBridgeMessage = (e: MessageEvent) => {
  const iframe = iframeRef.value
  const viewport = viewportRef.value
  if (!iframe || !viewport) return
  // 放宽来源：允许同源消息或未知来源（file/null），不限定具体层级
  if (allowedOrigin.value && e.origin && e.origin !== allowedOrigin.value) return

  const iframeRect = iframe.getBoundingClientRect()

  const type = (e.data && e.data.type) as string
  const payload = e.data && e.data.payload
  if (!type) return

  if (type === 'viewer-ready') {
    bridgeReady.value = true
    return
  }

  // 处理来自 iframe 的键盘修饰键状态
  if (type === 'viewer:modifiers') {
    if (payload) {
      // 同步 Alt 键状态 - 这是最关键的!
      isAltPressed.value = payload.alt || false
    }
    return
  }

  if (type === 'viewer:wheel') {
    const synthetic: WheelEvent = {
      ctrlKey: true,
      metaKey: false,
      deltaY: payload.deltaY,
      preventDefault: () => {},
      clientX: (payload.absX ?? (iframeRect.left + payload.clientX)),
      clientY: (payload.absY ?? (iframeRect.top + payload.clientY)),
    } as unknown as WheelEvent
    handleWheel(synthetic)
    return
  }

  if (type === 'viewer:pan-start') {
    isDragging.value = true
    dragStartX.value = payload.absX ?? (iframeRect.left + payload.clientX)
    dragStartY.value = payload.absY ?? (iframeRect.top + payload.clientY)
    lastTranslateX.value = translateX.value
    lastTranslateY.value = translateY.value
    return
  }

  if (type === 'viewer:pan-move') {
    if (!isDragging.value) return
    const cx = payload.absX ?? (iframeRect.left + payload.clientX)
    const cy = payload.absY ?? (iframeRect.top + payload.clientY)
    const dx = cx - dragStartX.value
    const dy = cy - dragStartY.value
    // rAF 合并移动以提升顺滑度
    if (!(window as any).__pv_rAF) {
      ;(window as any).__pv_rAF = requestAnimationFrame(() => {
        (window as any).__pv_rAF = null
        translateX.value = lastTranslateX.value + dx
        translateY.value = lastTranslateY.value + dy
      })
    }
    return
  }

  if (type === 'viewer:pan-end') {
    isDragging.value = false
    return
  }
}

function startBridgeSupervisor() {
  stopBridgeSupervisor()
  supervisorId.value = window.setInterval(() => {
    try {
      const iframe = iframeRef.value
      if (!iframe || !iframe.contentWindow) return
      const cw = iframe.contentWindow as any
      const doc = iframe.contentDocument
      if (doc && !cw.__viewerBridgeInstalled) {
        const script = doc.createElement('script')
        script.type = 'text/javascript'
        script.setAttribute('data-viewer-bridge', 'true')  // 添加标记
        script.textContent = `
          (function(){
            function send(t,p){try{top.postMessage({type:t,payload:p},'*');}catch(e){}}
            function abs(win,x,y){var a={x:x,y:y},cur=win;try{while(cur&&cur!==cur.top){var fe=cur.frameElement;if(!fe)break;var r=fe.getBoundingClientRect();a.x+=r.left;a.y+=r.top;cur=cur.parent;}}catch(e){}return a;}
            function install(win){
              try{ if(win.__viewerBridgeInstalled) return; win.__viewerBridgeInstalled = true; }catch(e){}
              var rid=null,pan=false,last=null,sp=false,al=false;
              var kd=function(e){if(e.code==='Space'&&!e.repeat)sp=true;if(e.altKey)al=true;send('viewer:modifiers',{alt:e.altKey,ctrl:e.ctrlKey,meta:e.metaKey,space:sp});};
              var ku=function(e){if(e.code==='Space')sp=false;if(e.key==='Alt')al=false;send('viewer:modifiers',{alt:al,ctrl:e.ctrlKey,meta:e.metaKey,space:sp});};
              var wh=function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();var a=abs(win,e.clientX,e.clientY);send('viewer:wheel',{deltaY:e.deltaY,absX:a.x,absY:a.y});}};
              var md=function(e){if(e.button===1||sp||e.altKey){pan=true;var a=abs(win,e.clientX,e.clientY);send('viewer:pan-start',{absX:a.x,absY:a.y});}};
              var mm=function(e){if(!pan)return;var a=abs(win,e.clientX,e.clientY);last={absX:a.x,absY:a.y};if(rid)return;rid=win.requestAnimationFrame(function(){rid=null;if(last){send('viewer:pan-move',last);last=null;}})};
              var mu=function(e){if(!pan)return;pan=false;var a=abs(win,e.clientX,e.clientY);send('viewer:pan-end',{absX:a.x,absY:a.y});};
              win.addEventListener('keydown',kd,true);win.addEventListener('keyup',ku,true);
              win.addEventListener('wheel',wh,{passive:false});
              win.addEventListener('mousedown',md,true);win.addEventListener('mousemove',mm,true);win.addEventListener('mouseup',mu,true);
              if(win.document){win.document.addEventListener('keydown',kd,true);win.document.addEventListener('keyup',ku,true);}
            }
            function hook(el){try{if(el&&el.addEventListener){el.addEventListener('load',function(){try{install(el.contentWindow);}catch(e){}},true);} }catch(e){} try{if(el&&el.contentWindow)install(el.contentWindow);}catch(e){} }
            install(window);
            var fs=document.querySelectorAll('iframe');if(fs&&fs.forEach)fs.forEach(function(f){hook(f)});
            var mo=new MutationObserver(function(ms){ms.forEach(function(m){if(m.addedNodes)m.addedNodes.forEach(function(n){if(n.tagName==='IFRAME')hook(n)}); if(m.type==='attributes'&&m.attributeName==='src'&&m.target&&m.target.tagName==='IFRAME'){hook(m.target);} })});
            mo.observe(document.documentElement||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
            send('viewer-ready',{});
          })();
        `
        doc.head.appendChild(script)
      }
    } catch {}
  }, 200)  // 从 500ms 改为 200ms,更频繁检查
}

function stopBridgeSupervisor() {
  if (supervisorId.value) {
    clearInterval(supervisorId.value)
    supervisorId.value = null
  }
}
</script>

<style scoped>
.preview-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.preview-header {
  background: #fff;
  padding: 12px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-level {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
}

.preview-hint {
  font-size: 13px;
  color: #909399;
}

.zoom-btn {
  padding: 5px 12px;
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  margin-right: 4px;
}

.zoom-btn:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #2c2c2c;
}

.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.content-frame {
  border: none;
  background: #fff;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}

.interaction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  /* pointer-events controlled dynamically via :style */
}
</style>
