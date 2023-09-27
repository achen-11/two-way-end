import router from '../router'
import pinia from '../store/store'
import { useRouterStore, useUserStore } from '../store/store'
import { getUserInfo } from '../api/account';
import { UserInfo } from './types';


router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const routerStore = useRouterStore()
  let hasToken = localStorage.getItem('token')

  if (hasToken) {
    // 是否去登录页
    if (to.path === '/login') {
      console.log('揍我吧?');
      next({path: '/'})
    } else {
      // 获取页面权限
      const hasPermission = routerStore.validateRouter(to.path)
      if (hasPermission) {
        // 有权限直接放行
        next()
      } else {
        // 没有则获取校验token, 设置角色/路由
        try {
          const res = await (await fetch('/account?token=' + hasToken)).json()
          console.log('fetchRes', res);
          if (res.code === 200) {
            // 设置user/router/cookie
            userStore.userInfo = res.data
            routerStore.setRouter(res.data.role)
            // next({ ...to, replace: true })
            console.log('to', to);

            next({...to, replace: true})
          } else {
            // 校验失败, 清空token, cookie, 跳回login
            localStorage.removeItem('token')
            next('/login')
          }
        } catch (e) {
          localStorage.removeItem('token')
          next('/login')
        }
      }
    }
  } else {
    // 退回登录页
    console.log('没有token, 退回登录');
    if (to.path !== '/login') {
      localStorage.removeItem('token')
      next('/login')
    } else {
      localStorage.removeItem('token')
      next()
    }
  }
})