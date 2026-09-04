import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { captureInstallPrompt } from './composables/useInstallPrompt'
import { initI18n } from './i18n'
import { initTheme } from './composables/theme'
import { router } from './router'
import './style.css'

initTheme()
void initI18n()
captureInstallPrompt()
registerSW({ immediate: true })

createApp(App).use(router).mount('#app')
