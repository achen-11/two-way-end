import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import Layout from '@/Layout/layout.vue'
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
    redirect: '/index',
    meta: { title: '首页' },
    children: [
      {
        path: '/announce-stu',
        name: 'announce-stu',
        component: () => import('@/view/announce/student-index.vue'),
        meta: { roles: [ROLE.Student], title: "通知公告" }
      },
      {
        path: '/termInfo',
        name: 'termInfo',
        component: () => import('@/view/termInfo/index.vue'),
        meta: { roles: [ROLE.Admin], title: "选课信息" }
      },
      {
        path: '/index',
        name: 'index',
        component: () => import('@/view/empty.vue'),
        meta: { roles: [ROLE.Student, ROLE.Admin, ROLE.Teacher], hidden: true }
      },
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
        component: () => import('@/view/student-manage/major.vue'),
        meta: { roles: [ROLE.Admin], title: "专业管理" }
      },
      {
        path: '/student/class',
        name: 'class',
        component: () => import('@/view/student-manage/class.vue'),
        meta: { roles: [ROLE.Admin], title: "班级管理" }
      },
      {
        path: '/student/student',
        name: 'student',
        component: () => import('@/view/student-manage/index.vue'),
        meta: { roles: [ROLE.Admin], title: "学生管理" }
      }
    ]
  },
  // Admin-教师信息管理
  {
    path: '/teacher',
    name: 'teacher',
    component: Layout,
    meta: { roles: [ROLE.Admin], title: '教师信息管理' },
    children: [{
      path: '/teacher/manage',
      name: 'teacher',
      component: () => import('@/view/teacher-manage/index.vue'),
      meta: { roles: [ROLE.Admin], title: "教师管理" }
    }]
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
        component: () => import('@/view/course-manage/cur-course.vue'),

        meta: { roles: [ROLE.Admin], title: '当前课程信息' }
      },
      {
        path: '/adminCourse/history',
        name: 'historyCourse',
        component: () => import('@/view/course-manage/history.vue'),
        meta: { roles: [ROLE.Admin], title: '历史课程信息' }
      }
    ]
  },
  // Admin-通知管理
  {
    path: '/announce',
    name: 'announce-admin',
    component: Layout,
    meta: { roles: [ROLE.Admin, ROLE.Student], title: '通知管理' },
    children: [
      {
        path: '/announce/modal',
        name: 'modalAnnounce',
        component: () => import('@/view/announce/modal.vue'),
        meta: { roles: [ROLE.Admin], title: "弹窗通知管理" }
      },
      {
        path: '/announce/list',
        name: 'announce-manage',
        component: () => import('@/view/announce/index.vue'),
        meta: { roles: [ROLE.Admin], title: "通知管理" }
      },
      {
        path: '/announce/edit',
        name: 'announceEdit',
        component: () => import('@/view/announce/detail.vue'),
        meta: { roles: [ROLE.Admin], title: "通知详情", hidden: true }
      },
      {
        path: '/announce/detail',
        name: 'announceDetail',
        component: () => import('@/view/announce/preview.vue'),
        meta: { roles: [ROLE.Student], title: "通知详情", hidden: true }
      },
      {
        path: '/announce/preview',
        name: 'announcePreview',
        component: () => import('@/view/announce/preview.vue'),
        meta: { roles: [ROLE.Admin], title: "通知预览", hidden: true }
      },
    ]
  },

  // Student-选课
  {
    path: '/two-way',
    name: 'stuSelect',
    component: Layout,
    meta: { roles: [ROLE.Student], title: '双向选课' },
    children: [
      {
        path: '/two-way/select',
        name: 'selectCourse',
        component: () => import('@/view/student-select/index.vue'),
        meta: { roles: [ROLE.Student], title: '双向选课' }
      }
    ]
  },
  // Student-选课结果
  {
    path: '/stu-select',
    name: 'stu-select',
    component: Layout,
    meta: { roles: [ROLE.Student], title: '选课结果' },
    children: [
      {
        path: '/stu-select/result',
        name: 'stu-select-result',
        component: () => import('@/view/student-result/index.vue'),
        meta: { roles: [ROLE.Student], title: '选课结果' }
      }
    ]
  },
  // 404 Page
  {
    path: '/404Page',
    name: '404Page',
    component: () => import('@/view/404.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404Page',
    meta: { roles: [ROLE.Admin, ROLE.Student, ROLE.Teacher], hidden: true }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes.concat(dynamicRoutes)
})

// reset router
export function resetRouter() {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name === 'login') return
    if (name) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export default router