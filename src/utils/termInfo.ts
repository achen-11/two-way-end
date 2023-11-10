import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween)
import { OriTermInfo } from "./types";

/**
 * 判断当前选课阶段
 * @param termInfo 选课信息
 * @return 选课阶段
 */
export function getCurrentStage(termInfo: OriTermInfo) {
  const {
    id,
    exhibit_stage_start, exhibit_stage_end,
    first_stage_start, first_stage_end,
    second_stage_start, second_stage_end,
    third_stage_start, third_stage_end
  } = termInfo
  const now = dayjs();
  // 没有进行中的选课
  if (!id) return { stage: -999, timeRange: null, title: '非选课时间' }
  // 选课未开始
  if (now.isBefore(dayjs(exhibit_stage_start))) {
    return { stage: -999, timeRange: null, title: '选课未开始' }  
  } 
  // 展示阶段
  else if (now.isBetween(dayjs(exhibit_stage_start), dayjs(exhibit_stage_end))) {
    return { stage: 0, timeRange: [exhibit_stage_start, exhibit_stage_end], title: '展示阶段' }
  } 
  // 展示阶段 end & 第一阶段 start
  else if (now.isBetween(dayjs(exhibit_stage_end), dayjs(first_stage_start))) {
    return { stage: -999, timeRange: [first_stage_start, first_stage_end], title: '第一轮选课', description: '展示阶段结束, 等待第一轮选课开始'}
  }
  // 第一阶段
  else if (now.isBetween(dayjs(first_stage_start), dayjs(first_stage_end))) {
    return { stage: 1, timeRange: [first_stage_start, first_stage_end], title: '第一轮选课' }
  } 
  // 第一阶段 end & 第二阶段 start
  else if (now.isBetween(dayjs(first_stage_end), dayjs(second_stage_start))) {
    return { stage: -999, timeRange: [second_stage_start, second_stage_end], title: '第二轮选课', description: '第一轮选课结束, 等待第二轮选课开始'}
  }
  // 第二阶段
  else if (now.isBetween(dayjs(second_stage_start), dayjs(second_stage_end))) {
    return { stage: 2, timeRange: [second_stage_start, second_stage_end], title: '第二轮选课' }
  }
  // 第二阶段 end & 第三阶段 start
  else if (now.isBetween(dayjs(second_stage_end), dayjs(third_stage_start))) {
    return { stage: -999, timeRange: [third_stage_start, third_stage_end], title: '第三轮选课', description: '第二轮选课结束, 等待第三轮选课开始'}
  }
  // 第三阶段
  else if (now.isBetween(dayjs(third_stage_start), dayjs(third_stage_end))) {
    return { stage: 3, timeRange: [third_stage_start, third_stage_end], title: '第三轮选课' }
  } 
  // 选课结束
  else if (now.isAfter(dayjs(third_stage_end))) {
    return { stage: 999, timeRange: null, title: '选课已结束' }
  }
}