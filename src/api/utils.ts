export const failRsp = (message: string, code=400, result={}) => {
  return {
    result,
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