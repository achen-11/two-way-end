import { RouteRecordRaw, useRouter } from "vue-router"
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
export const dateTimeFormat = (date, format='YYYY-MM-DD HH:mm:ss')=>{
  if (!date) return
  return dayjs(date).format(format)
}

/* ================================= Other Utils ================================= */
// 请求结果处理
export const handleResponse = (response: any, fn: Function, errorFn?: Function) =>{
  if (response.code === 401) {
    notification.error({message: '身份校验异常', description: JSON.stringify(response.message)})
    localStorage.removeItem('token')
    const router = useRouter()
    router.push('/login')
  } else if (response.code === 200) {
    fn()
  } else if (errorFn) {
    errorFn()
  }
  else {
    notification.error({message: '请求异常', description: JSON.stringify(response.message)})
  }
}

// 请求头-token
export const tokenHeader = ()=> {
  return { Authorization: 'two_way_token=' + localStorage.getItem('token') }
}


/**
 * 传入 buffer 下载xlsx文件
 * @param buffer 目标 buffer
 * @param name 文件名称
 */
export const downloadExcel = (buffer: ArrayBuffer, name: string) => {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(new Blob([blob]));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

/**
 * 处理课程数据的 majorLimits \ stageLimits \ teachers
 */
export const formatCourse = (course) => {
  course.major_limits = course.majorLimit.map(item => item.major_id)
  course.grade_limits_exhibit = []
  course.grade_limits_first = []
  course.grade_limits_second = []
  course.grade_limits_third = []
  course.stageLimit.forEach(item => {
    if (item.stage === 0) return course.grade_limits_exhibit.push(item.grade)
    if (item.stage === 1) return course.grade_limits_first.push(item.grade)
    if (item.stage === 2) return course.grade_limits_second.push(item.grade)
    if (item.stage === 3) return course.grade_limits_third.push(item.grade)
  })
  course.teachers = course.CourseTeachers.map(item => item.teacher_id)
  return course
}