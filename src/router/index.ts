import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import Layout from '@/Layout/layout.vue'
import Announce from '@/view/announce/index.vue'
import Login from '@/view/login/index.vue'
import { ROLE } from '@/utils/types'


export const routes: RouteRecordRaw[] = [
  {
    path: '/login', 
    component: () => import('../view/login/index.vue'),
    meta: { title: "登录" }
  },
]

export const dynamicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    name: 'Root',
    children: [
      {
        path: '/',
        name: 'announce',
        component: Announce,
        meta: {roles: [ROLE.Student]}
      },
      {
        path: '/',
        name: 'termInfo',
        component: ()=> import('@/view/termInfo/index.vue'),
        meta: {roles: [ROLE.Admin]}
      },
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router