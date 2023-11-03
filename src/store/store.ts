import { defineStore, createPinia } from "pinia";
import { ROLE, UserInfo } from "../utils/types";
import router, { dynamicRoutes, resetRouter, routes } from "@/router";
import { generateRoutes, getAllPaths, tokenHeader } from "@/utils";
import { getUserInfo } from "@/api/service/account";

const pinia = createPinia();
export default pinia;



export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      
    } as UserInfo
  }),
  actions: {
    async getUserInfo(token: string) {
      return await getUserInfo({query: {token}, headers: tokenHeader()})
    }
  }
})

export const useRouterStore = defineStore('router', {
  state: () => ({
      routers: [...router.getRoutes()],
      pathList: [...getAllPaths(router.getRoutes())],
      isSetDynamicRouter: false

  }),
  actions: {
    validateRouter(path: string) {
      return this.pathList.includes(path)
    },
    
    setRouter(role: ROLE) {
      // 动态路由
      resetRouter()
      const dynamicRoutesList = generateRoutes(dynamicRoutes, role)
      // 把动态路由加入到routers
      dynamicRoutesList.forEach(r=>{
        router.addRoute(r)
      })
      this.routers = router.getRoutes()

      // 填上pathList
      this.pathList = []
      this.pathList = getAllPaths(router.getRoutes())
      this.isSetDynamicRouter = true
      // console.log('动态路由设置完成', router.getRoutes());
      
    },
    clearRouter() {
      this.routers = []
      this.pathList = []
    },
    hasRoute(name) {
      return router.hasRoute(name)
    }
  }
})
