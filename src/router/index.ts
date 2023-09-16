import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import Layout from '@/Layout/layout.vue'
import Announce from '@/view/announce/index.vue'
import Login from '@/view/login/index.vue'


const routes: RouteRecordRaw[] = [
  {
    path: '/login', component: () => import('../view/login/index.vue')
  },
  {
    path: '/',
    component: Layout,
    name: 'Root',
    children: [
      {
        path: '/',
        name: 'announce',
        component: Announce
      }
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router