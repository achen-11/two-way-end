import { createApp } from 'vue';
import App from './App.vue';

import './styles/style.css'
const app = createApp(App)


// antd
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css'
app.use(Antd)

// router
import router from './router'
app.use(router)


app.mount('#app');
