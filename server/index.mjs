import { createServer } from 'node:http'
import { promises as fs } from 'node:fs'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SERVER_DIR, '..')
const WEB_ROOT = path.resolve(process.env.XIUXIAN_WEB_ROOT || path.join(PROJECT_ROOT, 'docs'))
const DATA_DIR = path.resolve(process.env.XIUXIAN_DATA_DIR || path.join(SERVER_DIR, 'data'))
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json')
const PORT = Number(process.env.PORT || 3030)
const HOST = process.env.HOST || '0.0.0.0'
const MAX_BODY_BYTES = 5 * 1024 * 1024
const SESSION_COOKIE = 'xiuxian_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

let accountsCache = null
let accountWriteQueue = Promise.resolve()

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }

const sendJson = (res, status, payload, headers = {}) => {
  res.writeHead(status, { ...jsonHeaders, ...headers })
  res.end(JSON.stringify(payload))
}

const parseCookies = header => {
  const cookies = {}
  for (const item of String(header || '').split(';')) {
    const separator = item.indexOf('=')
    if (separator <= 0) continue
    const key = item.slice(0, separator).trim()
    const rawValue = item.slice(separator + 1).trim()
    if (!key) continue
    try {
      cookies[key] = decodeURIComponent(rawValue)
    } catch {
      cookies[key] = rawValue
    }
  }
  return cookies
}

const sessionCookie = token => {
  const secure = process.env.XIUXIAN_COOKIE_SECURE === 'true' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure}`
}

const clearSessionCookie = () => `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`

const readJsonBody = req => new Promise((resolve, reject) => {
  let body = ''
  let size = 0
  let settled = false
  req.setEncoding('utf8')
  req.on('data', chunk => {
    if (settled) return
    size += Buffer.byteLength(chunk)
    if (size > MAX_BODY_BYTES) {
      settled = true
      reject(Object.assign(new Error('请求内容过大'), { statusCode: 413 }))
      req.destroy()
      return
    }
    body += chunk
  })
  req.on('end', () => {
    if (settled) return
    settled = true
    if (!body.trim()) {
      resolve({})
      return
    }
    try {
      resolve(JSON.parse(body))
    } catch {
      reject(Object.assign(new Error('请求不是有效的 JSON'), { statusCode: 400 }))
    }
  })
  req.on('error', error => {
    if (!settled) {
      settled = true
      reject(error)
    }
  })
})

const loadAccounts = async () => {
  if (accountsCache) return accountsCache
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    accountsCache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    accountsCache = {}
  }
  return accountsCache
}

const saveAccounts = async accounts => {
  const operation = accountWriteQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const tempFile = `${ACCOUNTS_FILE}.${process.pid}.tmp`
    const serialized = JSON.stringify(accounts, null, 2)
    await fs.writeFile(tempFile, serialized, { encoding: 'utf8', mode: 0o600 })
    try {
      await fs.rename(tempFile, ACCOUNTS_FILE)
    } catch (error) {
      await fs.writeFile(ACCOUNTS_FILE, serialized, { encoding: 'utf8', mode: 0o600 })
      await fs.rm(tempFile, { force: true })
    }
  })
  accountWriteQueue = operation.catch(() => undefined)
  return operation
}

const normalizeUsername = value => String(value || '').trim()

const validateCredentials = (username, password) => {
  const normalizedUsername = normalizeUsername(username)
  if (Array.from(normalizedUsername).length < 2 || Array.from(normalizedUsername).length > 24) {
    return '账号长度需要为 2 到 24 个字符'
  }
  if (!/^[\u4e00-\u9fffA-Za-z0-9_-]+$/.test(normalizedUsername)) {
    return '账号只能包含中文、字母、数字、下划线或短横线'
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return '密码长度需要为 8 到 128 个字符'
  }
  return ''
}

const hashPassword = password => {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

const verifyPassword = (password, account) => {
  try {
    const expected = Buffer.from(account.passwordHash, 'hex')
    const actual = scryptSync(password, account.passwordSalt, expected.length)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

const hashSessionToken = token => createHash('sha256').update(token).digest('hex')

const createSession = async (accounts, username) => {
  const token = randomBytes(32).toString('hex')
  const account = accounts[username]
  const now = Date.now()
  const activeSessions = Array.isArray(account.sessions)
    ? account.sessions.filter(session => Number(session.expiresAt) > now && typeof session.hash === 'string')
    : []
  account.sessions = [...activeSessions.slice(-4), {
    hash: hashSessionToken(token),
    expiresAt: now + SESSION_MAX_AGE * 1000
  }]
  await saveAccounts(accounts)
  return token
}

const getSessionAccount = async req => {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const accounts = await loadAccounts()
  const tokenHash = hashSessionToken(token)
  for (const account of Object.values(accounts)) {
    const session = Array.isArray(account.sessions)
      ? account.sessions.find(item => item.hash === tokenHash && Number(item.expiresAt) > Date.now())
      : null
    if (session) return { account, token }
  }
  return null
}

const publicAccount = account => ({
  username: account.username,
  createdAt: account.createdAt,
  saveUpdatedAt: account.saveUpdatedAt || null
})

const requireAccount = async (req, res) => {
  const session = await getSessionAccount(req)
  if (!session) {
    sendJson(res, 401, { ok: false, message: '请先登录账号' })
    return null
  }
  return session
}

const routeApi = async (req, res, pathname) => {
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, service: 'xiuxian-account', time: new Date().toISOString() })
    return true
  }

  if (pathname === '/api/account/register' && req.method === 'POST') {
    const body = await readJsonBody(req)
    const username = normalizeUsername(body.username)
    const validationError = validateCredentials(username, body.password)
    if (validationError) {
      sendJson(res, 400, { ok: false, message: validationError })
      return true
    }
    const accounts = await loadAccounts()
    if (accounts[username]) {
      sendJson(res, 409, { ok: false, message: '这个账号已经存在' })
      return true
    }
    const password = hashPassword(body.password)
    accounts[username] = {
      username,
      passwordSalt: password.salt,
      passwordHash: password.hash,
      createdAt: new Date().toISOString(),
      saveData: null,
      saveUpdatedAt: null
    }
    await saveAccounts(accounts)
    const token = await createSession(accounts, username)
    sendJson(res, 201, { ok: true, account: publicAccount(accounts[username]) }, { 'Set-Cookie': sessionCookie(token) })
    return true
  }

  if (pathname === '/api/account/login' && req.method === 'POST') {
    const body = await readJsonBody(req)
    const username = normalizeUsername(body.username)
    const accounts = await loadAccounts()
    const account = accounts[username]
    if (!account || !verifyPassword(body.password, account)) {
      sendJson(res, 401, { ok: false, message: '账号或密码不正确' })
      return true
    }
    const token = await createSession(accounts, username)
    sendJson(res, 200, { ok: true, account: publicAccount(account) }, { 'Set-Cookie': sessionCookie(token) })
    return true
  }

  if (pathname === '/api/account/logout' && req.method === 'POST') {
    const cookies = parseCookies(req.headers.cookie)
    const token = cookies[SESSION_COOKIE]
    if (token) {
      const accounts = await loadAccounts()
      const tokenHash = hashSessionToken(token)
      let changed = false
      for (const account of Object.values(accounts)) {
        if (!Array.isArray(account.sessions)) continue
        const nextSessions = account.sessions.filter(session => session.hash !== tokenHash)
        if (nextSessions.length !== account.sessions.length) {
          account.sessions = nextSessions
          changed = true
        }
      }
      if (changed) await saveAccounts(accounts)
    }
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() })
    return true
  }

  if (pathname === '/api/account/me' && req.method === 'GET') {
    const session = await requireAccount(req, res)
    if (!session) return true
    sendJson(res, 200, { ok: true, account: publicAccount(session.account) })
    return true
  }

  if (pathname === '/api/account/save' && req.method === 'GET') {
    const session = await requireAccount(req, res)
    if (!session) return true
    sendJson(res, 200, {
      ok: true,
      saveData: session.account.saveData || null,
      updatedAt: session.account.saveUpdatedAt || null
    })
    return true
  }

  if (pathname === '/api/account/save' && req.method === 'PUT') {
    const session = await requireAccount(req, res)
    if (!session) return true
    const body = await readJsonBody(req)
    if (typeof body.saveData !== 'string' || body.saveData.length < 20 || body.saveData.length > MAX_BODY_BYTES) {
      sendJson(res, 400, { ok: false, message: '云存档内容无效或过大' })
      return true
    }
    const accounts = await loadAccounts()
    const account = accounts[session.account.username]
    account.saveData = body.saveData
    account.saveUpdatedAt = new Date().toISOString()
    await saveAccounts(accounts)
    sendJson(res, 200, { ok: true, updatedAt: account.saveUpdatedAt })
    return true
  }

  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { ok: false, message: '接口不存在' })
    return true
  }
  return false
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
}

const serveStatic = async (req, res, pathname) => {
  let requestedPath
  try {
    requestedPath = decodeURIComponent(pathname)
  } catch {
    sendJson(res, 400, { ok: false, message: '资源路径无效' })
    return
  }
  if (requestedPath.includes('..')) {
    sendJson(res, 403, { ok: false, message: '禁止访问该路径' })
    return
  }
  let filePath = path.resolve(WEB_ROOT, `.${requestedPath === '/' ? '/index.html' : requestedPath}`)
  try {
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html')
  } catch {
    if (path.extname(filePath)) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    filePath = path.join(WEB_ROOT, 'index.html')
  }
  try {
    const body = await fs.readFile(filePath)
    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('Not Found')
  }
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname
  try {
    if (await routeApi(req, res, pathname)) return
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { ok: false, message: '请求方法不支持' })
      return
    }
    await serveStatic(req, res, pathname)
  } catch (error) {
    console.error('请求处理失败:', error)
    sendJson(res, error.statusCode || 500, { ok: false, message: error.statusCode ? error.message : '服务器内部错误' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`修仙模拟器服务已启动: http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`)
  console.log(`账号数据目录: ${DATA_DIR}`)
})
