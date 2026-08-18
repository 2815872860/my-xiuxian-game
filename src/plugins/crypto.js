// 使用 CryptoJS 进行数据加密和解密
import CryptoJS from 'crypto-js'

// 数据加密
export const encryptData = data => {
  try {
    const jsonStr = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonStr, 'vue-idle-xiuxian').toString()
  } catch (error) {
    console.error('数据加密失败:', error)
    return null
  }
}

// 数据解密
export const decryptData = encryptedData => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, 'vue-idle-xiuxian')
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedStr)
  } catch (error) {
    console.error('数据解密失败:', error)
    return null
  }
}

// 数据校验
export const validateData = data => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('数据验证失败: 存档格式无效')
    return false
  }
  // 检查必要的数据字段
  const requiredFields = ['name', 'level', 'realm', 'cultivation', 'maxCultivation', 'spirit', 'baseAttributes']

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`数据验证失败: 缺少必要字段 ${field}`)
      return false
    }
  }

  // 检查数值的合理性
  const numericFields = ['level', 'cultivation', 'maxCultivation', 'spirit']
  if (
    numericFields.some(field => !Number.isFinite(Number(data[field]))) ||
    Number(data.level) < 1 ||
    Number(data.maxCultivation) <= 0 ||
    Number(data.cultivation) < 0 ||
    Number(data.spirit) < 0 ||
    !data.baseAttributes ||
    typeof data.baseAttributes !== 'object' ||
    Array.isArray(data.baseAttributes)
  ) {
    console.error('数据验证失败: 数值异常')
    return false
  }

  return true
}
