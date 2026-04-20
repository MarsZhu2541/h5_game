import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { ElMessage } from 'element-plus'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.config.globalProperties.$message = ElMessage
app.mount('#app')
