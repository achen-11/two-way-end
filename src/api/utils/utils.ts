import { ExcelColumn } from '@/api/utils/types'
import Excel from 'exceljs'

/**
 * 请求异常响应格式化
 * @param message 异常信息
 * @param code 异常 code
 * @param data 数据
 * @returns 
 */
export const failRsp = (message: string, code=400, data={}) => {
  return {
    data,
    message,
    code
  }
}

/**
 * 请求成功响应格式化
 * @param data 响应数据
 * @param message 请求信息
 * @param code 响应码
 * @returns 
 */
export const successRsp = (data: any, message="success", code=200) => {
  return {
    data,
    message,
    code
  }
}

/**
 * 将数据转换成 excel 并导出
 * @param data 需要导出数据
 * @param columns excel 表头
 * @returns 文件流 buffer
 */
export const exportExcel = async <T>(data: T[], columns: ExcelColumn[]) => {
  // 创建 workbook
  const workbook = new Excel.Workbook()
  const sheet = workbook.addWorksheet('sheet1')
  if (columns) {
    sheet.addRow(columns.map(col=>col.label))
  }
  // 遍历数据
  data.forEach((row)=>{
    const data = []
    columns.forEach(col=>{
      data.push(row[col.value])
    })
    sheet.addRow(data)
  })
  // 生成文件流
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer


  // const path = await workbook.xlsx.writeFile('学生数据.xlsx')
  // return path
  
}