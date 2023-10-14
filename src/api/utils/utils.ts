import { ExcelColumn } from '@/utils/types'
import Excel from 'exceljs'

export const failRsp = (message: string, code=400, data={}) => {
  return {
    data,
    message,
    code
  }
}

export const successRsp = (data: any, message="success", code=200) => {
  return {
    data,
    message,
    code
  }
}

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