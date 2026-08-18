const SESSION_KEY = 'xiuxian-account-session'
const REQUEST_TIMEOUT = 10000

const readStoredAccount = () => {
  try {
    const value = localStorage.getItem(SESSION_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

const writeStoredAccount = account => {
  try {
    if (account) localStorage.setItem(SESSION_KEY, JSON.stringify(account))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // 账号状态只用于界面显示，Cookie 仍由浏览器负责保存。
  }
}

const request = async (url, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      },
      signal: controller.signal
    })
    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    if (!response.ok) {
      throw new Error(payload?.message || `服务器响应异常（${response.status}）`)
    }
    return payload || {}
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('请求超时，请确认账号服务正在运行')
    if (error instanceof TypeError) throw new Error('账号服务不可用，请确认当前地址已启用账号服务')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const getStoredAccount = () => readStoredAccount()

export const registerAccount = async (username, password) => {
  const result = await request('/api/account/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
  writeStoredAccount(result.account)
  return result.account
}

export const loginAccount = async (username, password) => {
  const result = await request('/api/account/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
  writeStoredAccount(result.account)
  return result.account
}

export const refreshAccount = async () => {
  try {
    const result = await request('/api/account/me')
    writeStoredAccount(result.account)
    return result.account
  } catch (error) {
    if (/登录|账号/.test(error.message)) writeStoredAccount(null)
    throw error
  }
}

export const logoutAccount = async () => {
  try {
    await request('/api/account/logout', { method: 'POST' })
  } finally {
    writeStoredAccount(null)
  }
}

export const uploadCloudSave = async saveData => {
  const result = await request('/api/account/save', {
    method: 'PUT',
    body: JSON.stringify({ saveData })
  })
  return result.updatedAt
}

export const downloadCloudSave = async () => {
  const result = await request('/api/account/save')
  return { saveData: result.saveData || null, updatedAt: result.updatedAt || null }
}
