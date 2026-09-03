import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { captureInstallPrompt } from './composables/useInstallPrompt'
import { router } from './router'
import './style.css'

captureInstallPrompt()
registerSW({ immediate: true })

createApp(App).use(router).mount('#app')
