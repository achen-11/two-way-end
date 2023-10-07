import { RouteRecordRaw } from "vue-router"
import { ROLE } from "./types"
import dayjs from "dayjs";
import { notification } from "ant-design-vue";

/* ================================= Router Utils ================================= */

export const  generateRoutes = (allRoutes: RouteRecordRaw[], role: ROLE) => {
  return allRoutes.filter(route => {
    const roles= <ROLE[] | undefined>route?.meta?.roles;
    if (roles) {
      return roles.includes(role);
    } else {
      return true; // 通用路由
    }
  }).map(route => {
    const newRoute = { ...route };
    if (newRoute.children) {
      newRoute.children = generateRoutes(newRoute.children, role);
    }
    return newRoute;
  });
}

export function getAllPaths(routes: RouteRecordRaw[]): string[] {
  const paths: string[] = [];

  routes.forEach(route => {
    if (route.path) {
      paths.push(route.path);
    }

    if (route.children) {
      const childPaths = getAllPaths(route.children);
      paths.push(...childPaths);
    }
  });

  return paths;
}

/* ================================= Format Utils ================================= */
// 日期格式化-datetime
export const dateTimeFormat = (date)=>{
  if (!date) return
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

/* ================================= Other Utils ================================= */
// 请求结果处理
export const handleResponse = (response: any, fn: Function) =>{
  if (response.code === 401) {
    notification.error({message: '请求异常', description: response.message})
  } else if (response.code === 200) {
    fn()
  } else {
    notification.error({message: '请求异常', description: response.message})
  }
}

// 请求头-token
export const tokenHeader = { Authorization: 'two_way_token=' + localStorage.getItem('token') }