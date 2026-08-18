const DB_NAME = 'idle-xiuxian'
const DB_VERSION = 1
const STORE_NAME = 'player-data'
const LOCAL_PREFIX = 'idle-xiuxian:'
const DB_OPEN_TIMEOUT = 4000
const TRANSACTION_TIMEOUT = 6000
const CACHE = new Map() // 新增内存缓存

const CACHE_VERSIONS = new Map()

const nextCacheVersion = key => (CACHE_VERSIONS.get(key) || 0) + 1

const localKey = key => `${LOCAL_PREFIX}${key}`
const backupKey = key => `${key}:last-good`

const readLocal = key => {
  try {
    return window.localStorage.getItem(localKey(key))
  } catch (error) {
    console.warn('本地备份读取失败:', error)
    return null
  }
}

const writeLocal = (key, value) => {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(localKey(key))
    else window.localStorage.setItem(localKey(key), value)
    return true
  } catch (error) {
    console.warn('本地备份写入失败:', error)
    return false
  }
}

const runTransaction = (db, mode, callback) =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    let result
    let settled = false
    let timeout
    const finish = (handler, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      handler(value)
    }
    timeout = setTimeout(() => {
      try {
        transaction.abort()
      } catch {
        // Transaction may already be closed.
      }
      finish(reject, new Error('本地存档写入超时'))
    }, TRANSACTION_TIMEOUT)
    transaction.oncomplete = () => finish(resolve, result)
    transaction.onerror = () => finish(reject, transaction.error || new Error('IndexedDB transaction failed'))
    transaction.onabort = () => finish(reject, transaction.error || new Error('IndexedDB transaction aborted'))
    try {
      result = callback(store)
    } catch (error) {
      transaction.abort()
      finish(reject, error)
    }
  })

export class GameDB {
  static dbPromise = null
  static writeQueue = Promise.resolve()

  static async openDB() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        let settled = false
        let timeout
        const finish = (handler, value) => {
          if (settled) {
            value?.close?.()
            return
          }
          settled = true
          clearTimeout(timeout)
          handler(value)
        }
        timeout = setTimeout(() => finish(reject, new Error('本地存档打开超时')), DB_OPEN_TIMEOUT)
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = () => finish(reject, request.error || new Error('IndexedDB open failed'))
        request.onsuccess = () => finish(resolve, request.result)
        request.onblocked = () => console.warn('本地存档被其他页面占用，正在等待释放')
        request.onupgradeneeded = event => {
          const db = event.target.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME)
          }
        }
      }).catch(error => {
        // 打开失败不应永久缓存拒绝的 Promise；临时禁用、隐私模式或升级异常恢复后要允许重试。
        this.dbPromise = null
        throw error
      })
    }
    return this.dbPromise
  }

  static async getData(key) {
    // 内存缓存检查
    if (CACHE.has(key)) return CACHE.get(key)
    try {
      const db = await this.openDB()
      const stored = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)
        let settled = false
        let timeout
        const finish = (handler, value) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          handler(value)
        }
        timeout = setTimeout(() => {
          try {
            transaction.abort()
          } catch {
            // Transaction may already be closed.
          }
          finish(reject, new Error('本地存档读取超时'))
        }, TRANSACTION_TIMEOUT)
        request.onerror = () => finish(reject, request.error || new Error('IndexedDB read failed'))
        request.onsuccess = e => finish(resolve, e.target.result)
        transaction.onerror = () => finish(reject, transaction.error || new Error('IndexedDB read failed'))
        transaction.onabort = () => finish(reject, transaction.error || new Error('IndexedDB read aborted'))
      })
      const localBackup = readLocal(key)
      // localStorage 在 setData 中同步写入，优先使用它，避免 IndexedDB 的旧值覆盖刚保存的进度。
      const value = localBackup ?? stored
      if (value !== undefined && value !== null) CACHE.set(key, value)
      // IndexedDB 为空但本地备份存在时，顺手恢复 IndexedDB。
      if (stored == null && localBackup != null) this.setData(key, localBackup).catch(() => undefined)
      return value
    } catch (error) {
      const localBackup = readLocal(key)
      if (localBackup != null) {
        CACHE.set(key, localBackup)
        return localBackup
      }
      throw error
    }
  }

  static async getBackup(key) {
    const localBackup = readLocal(backupKey(key))
    if (localBackup != null) return localBackup
    try {
      const db = await this.openDB()
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const request = transaction.objectStore(STORE_NAME).get(backupKey(key))
        let settled = false
        let timeout
        const finish = (handler, value) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          handler(value)
        }
        timeout = setTimeout(() => finish(reject, new Error('本地备份读取超时')), TRANSACTION_TIMEOUT)
        request.onerror = () => finish(reject, request.error || new Error('IndexedDB backup read failed'))
        request.onsuccess = event => finish(resolve, event.target.result ?? null)
        transaction.onerror = () => finish(reject, transaction.error || new Error('IndexedDB backup read failed'))
        transaction.onabort = () => finish(reject, transaction.error || new Error('IndexedDB backup read aborted'))
      })
    } catch {
      return null
    }
  }

  static async clearBackup(key) {
    writeLocal(backupKey(key), null)
    try {
      const db = await this.openDB()
      await runTransaction(db, 'readwrite', store => store.delete(backupKey(key)))
    } catch {
      // Optional backup cleanup must not prevent the active save from being cleared.
    }
  }

  static async setData(key, value) {
    const hadPreviousValue = CACHE.has(key)
    const previousValue = CACHE.get(key)
    const previousVersion = CACHE_VERSIONS.get(key) || 0
    const version = nextCacheVersion(key)
    CACHE_VERSIONS.set(key, version)
    CACHE.set(key, value) // 先更新缓存
    const localSaved = writeLocal(key, value)
    const localBackupSaved =
      value === null || value === undefined || writeLocal(backupKey(key), value)

    const operation = this.writeQueue.then(async () => {
      try {
        const db = await this.openDB()
        await runTransaction(db, 'readwrite', store => {
          store.put(value, key)
          if (value !== null && value !== undefined) {
            store.put(value, backupKey(key))
          } else {
            store.delete(backupKey(key))
          }
        })
      } catch (error) {
        if (!localSaved || !localBackupSaved) throw error
      }
      return value
    })
    this.writeQueue = operation.catch(() => undefined)

    return operation.catch(error => {
      // 只有在没有更新的写入覆盖当前值时才回滚缓存，避免旧请求覆盖新状态。
      if ((CACHE_VERSIONS.get(key) || 0) === version) {
        CACHE_VERSIONS.set(key, previousVersion)
        if (hadPreviousValue) {
          CACHE.set(key, previousValue)
        } else {
          CACHE.delete(key)
        }
      }
      throw error
    })
  }

  // 新增批量操作接口
  static async batchSet(items) {
    if (!Array.isArray(items) || items.length === 0) return undefined
    const previous = items.map(([key]) => ({
      key,
      hadValue: CACHE.has(key),
      value: CACHE.get(key),
      version: CACHE_VERSIONS.get(key) || 0
    }))
    const versions = new Map()
    items.forEach(([key, value]) => {
      const version = nextCacheVersion(key)
      versions.set(key, version)
      CACHE_VERSIONS.set(key, version)
      CACHE.set(key, value)
      const backupKeyValue = backupKey(key)
      writeLocal(key, value)
      if (value === null || value === undefined) writeLocal(backupKeyValue, null)
      else writeLocal(backupKeyValue, value)
    })

    const operation = this.writeQueue.then(async () => {
      const db = await this.openDB()
      return runTransaction(db, 'readwrite', store => {
        items.forEach(([key, value]) => {
          store.put(value, key)
          if (value === null || value === undefined) store.delete(backupKey(key))
          else store.put(value, backupKey(key))
        })
      })
    })
    this.writeQueue = operation.catch(() => undefined)

    return operation.catch(error => {
      previous.forEach(({ key, hadValue, value, version }) => {
        if ((CACHE_VERSIONS.get(key) || 0) !== versions.get(key)) return
        CACHE_VERSIONS.set(key, version)
        if (hadValue) CACHE.set(key, value)
        else CACHE.delete(key)
      })
      throw error
    })
  }
}
