import { createApp } from 'vue';
import App from './App.vue';

import './styles/style.css'
import './styles/preflight.css'
const app = createApp(App)


// antd
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css'
app.use(Antd)


// store
import pinia from '@/store/store'
app.use(pinia)

// router
import router from './router'
app.use(router)
import '@/utils/permission' // 鉴权

app.mount('#app');
