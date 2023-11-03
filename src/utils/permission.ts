import { getUserInfo } from '@/api/service/account';
import router from '../router'
import { useRouterStore, useUserStore } from '../store/store'
import { notification } from 'ant-design-vue';



router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const routerStore = useRouterStore()
  let hasToken = localStorage.getItem('token')

  if (hasToken) {
    if (!routerStore.isSetDynamicRouter) {
      // 未设置动态路由
      // console.log('未设置动态路由');

      const res = await getUserInfo({ query: { token: hasToken }, headers: { 'Authorization': 'two_way_token=' + hasToken } })
      if (res.code === 200) {
        // 设置user/router/cookie
        userStore.userInfo = res.data
        routerStore.setRouter(res.data.role)
      } else {
        // 校验失败, 清空token, cookie, 跳回login
        if (res.code === 401) {
          notification.error({ message: res.message, description: res.message })
        }
        localStorage.removeItem('token')
        next({ path: '/login' })
      }
    }
    // 已设置动态路由

    if (to.path === '/login' && routerStore.validateRouter('/')) {
      // 去登录页
      // console.log('登录页, 但跳转了');
      next({ path: '/' })
    } else {
      const hasPermission = routerStore.validateRouter(to.path)
      if (hasPermission) {
        console.log('去了下一步', to.path);
        return next()
      } else {
        // console.log('没找到');
        next({ path: '/404' })
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
