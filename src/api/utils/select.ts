import { Selection, Term } from "@prisma/client";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween)


/**
 * 校验选课时间
 * @param termInfo 
 * @param stage 
 */
export const validateTrem = (termInfo: Term, stage: number) => {
  // 获取 stage 对应的选课时间
  let timeRange = []
  if (stage === 1) {
    timeRange = [termInfo.first_stage_start, termInfo.first_stage_end]
  } else if (stage === 2) {
    timeRange = [termInfo.second_stage_start, termInfo.second_stage_end]
  } else if (stage === 3) {
    timeRange = [termInfo.third_stage_start, termInfo.third_stage_end]
  } else {
    return 'stage参数异常, 非选课时间'
  }
  const now = dayjs()
  if (now.isBetween(dayjs(timeRange[0]), dayjs(timeRange[1]))) {
    return true
  } else {
    return '非选课时间'
  }
}

/**
 * 判断当前学生已选课程学分
 * 
 */
export const getStuSelectedNum = (selections: (Selection & {
  course: {
    course_id: string;
    week_num: string;
    course_time: string;
    score: number;
  };
})[], term: Term, stage: number) => {
  let num = 0
  selections.forEach(record => {
    if (record.term_id === term.id) {
      // 当前选课
      if (stage === 1) {
        // 第一阶段 
        if (record.stage === 1) num += record.course.score
      } else if (stage === 2) {
        // 第二轮 = 第一轮 agree + 第二轮 all
        if (record.stage === 1 && record.status === 1) num+= record.course.score
        if (record.stage === 2) num+= record.course.score
      } else {
        // 第三轮 = 第一轮 agree + 第二轮 agree + 第三轮 all
        if (record.stage === 1 && record.status === 1) num+= record.course.score
        if (record.stage === 2 && record.status === 1) num+= record.course.score
        if (record.stage === 3) num+= record.course.score
      }
    }
  })
  return num
}

interface SelectionRecord extends Selection {
  course: {
    course_id: string
  }
}
/**
 * 校验历史选课
 * 
 */
export const validateHistorySelected = (selection: SelectionRecord[], course_id: string) => {
  for (let i = 0; i < selection.length; i++) {
    const record = selection[i]
    if (record.course.course_id === course_id && record.status === 1) {
      return false
    }
  }
  return true
}