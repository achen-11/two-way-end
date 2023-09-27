import { RouteRecordRaw } from "vue-router"
import { ROLE } from "./types"

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
