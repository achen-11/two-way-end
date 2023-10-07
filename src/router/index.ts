import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import Layout from '@/Layout/layout.vue'
import Announce from '@/view/announce/index.vue'
import Login from '@/view/login/index.vue'
import { ROLE } from '@/utils/types'


export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: "login",
    component: () => import('@/view/login/index.vue'),
    meta: { title: "登录", hidden: true }
  },
]

export const dynamicRoutes: RouteRecordRaw[] = [
  // 首页
  {
    path: '/',
    component: Layout,
    name: 'Root',
    meta: { title: '首页' },
    children: [
      {
        path: '/',
        name: 'announce',
        component: Announce,
        meta: { roles: [ROLE.Student], title: "通知公告" }
      },
      {
        path: '/',
        name: 'termInfo',
        component: () => import('@/view/termInfo/index.vue'),
        meta: { roles: [ROLE.Admin], title: "选课信息" }
      }
    ]
  },
  // Admin-学生信息管理
  {
    path: '/student',
    name: 'student',
    component: Layout,
    meta: { roles: [ROLE.Admin], title: '学生信息管理' },
    children: [
      {
        path: '/student/major',
        name: 'major',
        component: () => import('@/view/major/index.vue'),
        meta: { roles: [ROLE.Admin], title: "专业管理" }
      }
    ]
  },
  // Admin-课程管理
  {
    path: '/adminCourse',
    name: 'adminCourse',
    component: Layout,
    meta: { roles: [ROLE.Admin], title: '课程管理' },
    children: [
      {
        path: '/adminCourse/cur',
        name: 'curCourse',
        // component: () => import('@/views/Course/Current/index.vue'),
        component: Announce,

        meta: { roles: [ROLE.Admin], title: '当前课程信息'}
      },
      {
        path: '/adminCourse/history',
        name: 'historyCourse',
        // component: () => import('@/views/Course/History/index.vue'),
        component: Announce,

        meta: { roles: [ROLE.Admin], title: '历史课程信息' }
      }
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
export default router