import { defineStore, createPinia } from "pinia";
import { ROLE, UserInfo } from "../utils/types";
import router, { dynamicRoutes } from "@/router";
import { generateRoutes, getAllPaths } from "@/utils";
import { getUserInfo } from "@/api/account";

const pinia = createPinia();
export default pinia;



export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      
    } as UserInfo
  }),
  actions: {
    async getUserInfo(token: string) {
      return await getUserInfo({query: {token}})
    }
  }
})

export const useRouterStore = defineStore('router', {
  state: () => ({
      routers: [],
      pathList: []

  }),
  actions: {
    validateRouter(path: string) {
      return this.pathList.includes(path)
    },
    setRouter(role: ROLE) {
      // 动态路由
      const dynamicRoutesList = generateRoutes(dynamicRoutes, role)
      // 把动态路由加入到routers
      dynamicRoutesList.forEach(r=>{
        router.addRoute(r)
      })
      this.routers = router.getRoutes()

      // 填上pathList
      this.pathList = []
      this.pathList = getAllPaths(router.getRoutes())

    },
  }
})
