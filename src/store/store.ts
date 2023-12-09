import { defineStore, createPinia } from "pinia";
import { ROLE, UserInfo, OriTermInfo } from "../utils/types";
import router, { dynamicRoutes, resetRouter, routes } from "@/router";
import { generateRoutes, getAllPaths, handleResponse, tokenHeader } from "@/utils";
import { getUserInfo } from "@/api/service/account";
import { getCurTermInfo } from "@/api/service/termInfo";
import { getCurrentStage, getCurrentTeacherStage } from "@/utils/termInfo";

const pinia = createPinia();
export default pinia;



export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      
    } as UserInfo,
    userSetting: {
      onlyShowStar: true
    }
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

export const useTermStore = defineStore('termInfo', {
  state: () => ({
    termInfo: {} as OriTermInfo,
    curStageInfo: { stage: -999, timeRange: [], title: '非选课时间' } as {stage: number, timeRange: string[], title: string, description?: string}
  }),
  actions: {
    // 设置全局选课信息
    async setTermInfo() {
      const res =  await getCurTermInfo()
      const userInfo = useUserStore().userInfo
      handleResponse(res, ()=>{
        this.termInfo = res.data
        const grade = res.data.academic_end - userInfo.class.enroll_year
        this.curStageInfo = getCurrentStage(res.data)
        if (grade > 4 || (userInfo.type===1 && grade > 2)) {
          this.curStageInfo.description = '您已毕业, 欢迎回来👏'
          this.curStageInfo.stage = -999
        }
      }, () => {
        this.curStageInfo = {stage: -999, timeRange: [], title: '非选课时间'}
      })
    },
    async setTeacherTermInfo() {
      const res = await getCurTermInfo()
      const userInfo = useUserStore().userInfo
      handleResponse(res, ()=>{
        this.termInfo = res.data
        this.curStageInfo = getCurrentTeacherStage(res.data)
      }, () => {
        this.curStageInfo = {stage: -999, timeRange: [], title: '非选课时间'}
      })
    }
  }
})
