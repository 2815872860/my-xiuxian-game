<template>
  <div class="settings-container">
    <n-card title="游戏设置">
      <template #header-extra>游戏版本{{ version }}</template>
      <n-space vertical>
        <n-input-group>
          <n-input v-model:value="newName" placeholder="输入新的道号" clearable :maxlength="maxLength" show-count />
          <n-button type="primary" @click="handleChangeName" :disabled="!newName">修改道号</n-button>
        </n-input-group>
        <n-alert title="必看说明" type="warning">
          本游戏为开源项目，如果您在任何地方通过付费方式购买了本游戏，请及时退款并投诉举报。
        </n-alert>
        <n-alert title="存档说明" type="info">
          进度会自动保存在当前浏览器，并同时保留一份本地备份。请尽量固定使用同一个地址进入游戏；127.0.0.1、localhost 和内网地址属于不同存档空间。需要换设备或换地址时，请先导出存档，再在新地址导入。
        </n-alert>
        <div class="save-profile">
          <div>
            <span>当前修行档案</span>
            <b>{{ playerStore.name || '无名修士' }}</b>
          </div>
          <div>
            <span>所在境界</span>
            <b>{{ playerStore.realm || '未入境' }}</b>
          </div>
          <div class="save-profile-status">
            <span>存档状态</span>
            <b>{{ saveStatus }}</b>
          </div>
        </div>
        <section class="account-panel">
          <div class="account-heading">
            <div>
              <b>云端账号</b>
              <small>{{ accountStatus }}</small>
            </div>
            <n-tag :type="accountUser ? 'success' : 'default'" size="small">{{ accountUser ? '已登录' : '未登录' }}</n-tag>
          </div>
          <template v-if="!accountUser">
            <n-space align="center" wrap>
              <n-input v-model:value="accountUsername" placeholder="账号（2-24个字符）" maxlength="24" clearable />
              <n-input v-model:value="accountPassword" type="password" show-password-on="click" placeholder="密码（至少8位）" maxlength="128" />
              <n-button type="primary" :loading="accountBusy" @click="handleAccountRegister">注册并登录</n-button>
              <n-button :loading="accountBusy" @click="handleAccountLogin">登录</n-button>
            </n-space>
          </template>
          <template v-else>
            <div class="account-user-row">
              <span>当前账号</span><b>{{ accountUser.username }}</b>
              <n-button size="small" type="primary" :loading="accountBusy" @click="handleCloudUpload">上传当前存档</n-button>
              <n-button size="small" type="info" :loading="accountBusy" @click="handleCloudRestore">从云端恢复</n-button>
              <n-button size="small" secondary :loading="accountBusy" @click="handleAccountLogout">退出登录</n-button>
            </div>
          </template>
          <p class="account-note">登录后可在其他设备使用同一账号恢复存档；云端保存的是加密存档，不是密码。</p>
        </section>
        <n-space>
          <n-button type="primary" :loading="isSaving" @click="handleSaveNow">立即保存</n-button>
          <n-button type="info" secondary :loading="localRestoreBusy" @click="handleLocalRestore">恢复本地备份</n-button>
          <n-button type="warning" @click="handleReincarnation">转世重修</n-button>
          <n-button @click="handleExportSave" type="info">导出存档</n-button>
          <n-upload :show-file-list="false" @change="handleImportSave">
            <n-button>导入存档</n-button>
          </n-upload>
          <n-button target="_blank" href="https://github.com/setube/vue-idle-xiuxian" tag="a" type="primary">
            开源地址
          </n-button>
          <n-button type="error" @click="qq = true">官方群聊</n-button>
        </n-space>
      </n-space>
    </n-card>
    <n-modal preset="dialog" title="玩家交流群" v-model:show="qq">
      <n-card :bordered="false" size="huge" role="dialog" aria-modal="true">
        <n-space vertical>
          <n-input value="920930589" readonly type="text" />
        </n-space>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
  import { usePlayerStore } from '../stores/player'
  import { onMounted, ref } from 'vue'
  import { useDialog, useMessage } from 'naive-ui'
  import { saveAs } from 'file-saver'
  import {
    downloadCloudSave,
    getStoredAccount,
    loginAccount,
    logoutAccount,
    refreshAccount,
    registerAccount,
    uploadCloudSave
  } from '../plugins/account'

  const clickCount = ref(0)
  const newName = ref('')
  const isImporting = ref(false)
  const isSaving = ref(false)
  const localRestoreBusy = ref(false)
  const saveStatus = ref('自动保存已开启')
  const message = useMessage()
  const maxLength = 6 // 定义道号最大长度常量
  const playerStore = usePlayerStore()
  const dialog = useDialog()
  const version = __APP_VERSION__
  const accountUsername = ref(getStoredAccount()?.username || '')
  const accountPassword = ref('')
  const accountUser = ref(getStoredAccount())
  const accountBusy = ref(false)
  const accountStatus = ref(accountUser.value ? '正在检查登录状态…' : '登录后可同步到其他设备')

  const handleAccountError = error => {
    accountStatus.value = error.message
    message.error(error.message)
  }

  const accountFormReady = () => {
    if (!accountUsername.value.trim() || accountPassword.value.length < 8) {
      message.warning('请输入账号和至少8位密码')
      return false
    }
    return true
  }

  const handleAccountRegister = async () => {
    if (accountBusy.value || !accountFormReady()) return
    accountBusy.value = true
    try {
      accountUser.value = await registerAccount(accountUsername.value, accountPassword.value)
      accountPassword.value = ''
      const saveData = await playerStore.exportData()
      const updatedAt = await uploadCloudSave(saveData)
      accountUser.value = { ...accountUser.value, saveUpdatedAt: updatedAt }
      accountStatus.value = `账号已创建，云端已保存 ${new Date(updatedAt).toLocaleTimeString()}`
      message.success('注册成功，当前存档已同步到云端')
    } catch (error) {
      handleAccountError(error)
    } finally {
      accountBusy.value = false
    }
  }

  const handleAccountLogin = async () => {
    if (accountBusy.value || !accountFormReady()) return
    accountBusy.value = true
    try {
      accountUser.value = await loginAccount(accountUsername.value, accountPassword.value)
      accountPassword.value = ''
      accountStatus.value = accountUser.value.saveUpdatedAt
        ? `账号已登录，上次云存档 ${new Date(accountUser.value.saveUpdatedAt).toLocaleTimeString()}`
        : '账号已登录，云端还没有存档'
      message.success('登录成功')
    } catch (error) {
      handleAccountError(error)
    } finally {
      accountBusy.value = false
    }
  }

  const handleAccountLogout = async () => {
    if (accountBusy.value) return
    accountBusy.value = true
    try {
      await logoutAccount()
      accountUser.value = null
      accountStatus.value = '已退出登录'
      message.success('已退出登录')
    } catch (error) {
      handleAccountError(error)
    } finally {
      accountBusy.value = false
    }
  }

  const handleCloudUpload = async () => {
    if (accountBusy.value) return
    accountBusy.value = true
    try {
      const saveData = await playerStore.exportData()
      const updatedAt = await uploadCloudSave(saveData)
      accountStatus.value = `云端已保存 ${new Date(updatedAt).toLocaleTimeString()}`
      message.success('当前存档已上传到云端')
    } catch (error) {
      handleAccountError(error)
    } finally {
      accountBusy.value = false
    }
  }

  const handleCloudRestore = async () => {
    if (accountBusy.value) return
    accountBusy.value = true
    try {
      const cloudSave = await downloadCloudSave()
      if (!cloudSave.saveData) {
        message.warning('这个账号还没有云存档，请先上传当前存档')
        accountBusy.value = false
        return
      }
      dialog.warning({
        title: '恢复云端存档',
        content: '恢复会覆盖当前浏览器里的进度，建议先导出本地存档。确定继续吗？',
        positiveText: '确认恢复',
        negativeText: '取消',
        closable: false,
        onPositiveClick: async () => {
          try {
            await playerStore.importData(cloudSave.saveData)
            accountStatus.value = cloudSave.updatedAt ? `已恢复 ${new Date(cloudSave.updatedAt).toLocaleTimeString()}` : '已恢复云端存档'
            message.success('云端存档恢复成功')
          } catch (error) {
            handleAccountError(error)
          } finally {
            accountBusy.value = false
          }
        },
        onNegativeClick: () => {
          accountBusy.value = false
        }
      })
    } catch (error) {
      accountBusy.value = false
      handleAccountError(error)
    }
  }

  const handleLocalRestore = () => {
    if (localRestoreBusy.value) return
    dialog.warning({
      title: '恢复本地备份',
      content: '这会覆盖当前浏览器里的进度，并恢复最近一次成功保存的本地存档。确定继续吗？',
      positiveText: '确认恢复',
      negativeText: '取消',
      closable: false,
      onPositiveClick: async () => {
        localRestoreBusy.value = true
        try {
          await playerStore.restoreLocalBackup()
          saveStatus.value = `已恢复本地备份 ${new Date().toLocaleTimeString()}`
          message.success('本地备份恢复成功')
        } catch (error) {
          message.error(error.message || '本地备份恢复失败')
        } finally {
          localRestoreBusy.value = false
        }
      }
    })
  }

  onMounted(async () => {
    if (!accountUser.value) return
    try {
      accountUser.value = await refreshAccount()
      accountUsername.value = accountUser.value.username
      accountStatus.value = '账号已登录'
    } catch {
      accountUser.value = null
      accountStatus.value = '登录已过期，请重新登录'
    }
  })

  const handleSaveNow = async () => {
    if (isSaving.value) return
    isSaving.value = true
    saveStatus.value = '正在保存…'
    try {
      const saved = await playerStore.saveData({ immediate: true })
      if (saved === false) {
        saveStatus.value = '保存失败，请导出备份'
        message.error('存档保存失败，请先导出备份')
      } else {
        saveStatus.value = `已保存 ${new Date().toLocaleTimeString()}`
        if (accountUser.value) {
          try {
            const cloudData = await playerStore.exportData()
            const updatedAt = await uploadCloudSave(cloudData)
            accountUser.value = { ...accountUser.value, saveUpdatedAt: updatedAt }
            accountStatus.value = `云端已保存 ${new Date(updatedAt).toLocaleTimeString()}`
            message.success('本地与云端存档均已保存')
          } catch (error) {
            accountStatus.value = '本地已保存，云端同步失败'
            message.warning(`本地已保存，云端暂未同步：${error.message}`)
          }
        } else {
          message.success('存档已保存')
        }
      }
    } catch (error) {
      saveStatus.value = '保存失败，请导出备份'
      message.error('保存失败：' + error.message)
    } finally {
      isSaving.value = false
    }
  }

  // 导出存档
  const handleExportSave = async () => {
    try {
      const saveData = await playerStore.exportData()
      if (!saveData) {
        message.error('没有可导出的存档数据！')
        return
      }
      // 导出加密后的存档数据
      saveAs(
        new Blob([saveData], { type: 'application/json;charset=utf-8' }),
        `我的放置仙途${version}版本存档数据-${new Date().toISOString().slice(0, 10)}-${Date.now()}.json`
      )
      message.success('存档导出成功！')
    } catch (error) {
      message.error('导出失败：' + error.message)
    }
  }

  // 导入存档
  const handleImportSave = data => {
    if (isImporting.value) return
    const file = data?.file?.file
    if (!file) {
      message.error('未读取到存档文件')
      return
    }
    isImporting.value = true
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const encryptedData = e.target.result
        await playerStore.importData(encryptedData)
        saveStatus.value = `已导入 ${new Date().toLocaleTimeString()}`
        message.success('存档导入成功！')
      } catch (error) {
        message.error('导入失败：' + error.message)
      } finally {
        isImporting.value = false
      }
    }
    reader.onerror = () => {
      isImporting.value = false
      message.error('文件读取失败，请重新选择存档')
    }
    reader.readAsText(file)
  }

  // 转世重修确认
  const handleReincarnation = () => {
    clickCount.value++
    if (clickCount.value >= 10) {
      dialog.warning({
        title: '提示',
        content: 'GM模式已开启！',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          playerStore.isGMMode = true
          playerStore.saveData()
        }
      })
      return
    }
    dialog.warning({
      title: '转世重修确认',
      content: '确定要转世重修吗？这将清空所有数据重新开始！',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        // 二次确认
        dialog.warning({
          title: '最终确认',
          content: '这是最后的确认，转世后将无法恢复！确定继续吗？',
          positiveText: '确定转世',
          negativeText: '再想想',
          onPositiveClick: async () => {
            await playerStore.clearData()
            location.href = location.origin
          }
        })
      }
    })
  }

  const qq = ref(false)

  // 修改道号
  const handleChangeName = () => {
    if (!newName.value.trim()) {
      message.warning('道号不能为空！')
      return
    }
    if (newName.value.trim().length > maxLength) {
      message.warning(`道号长度不能超过${maxLength}个字符！`)
      return
    }
    // 计算修改道号所需灵石
    const spiritStoneCost = playerStore.nameChangeCount === 0 ? 0 : Math.pow(2, playerStore.nameChangeCount) * 100
    // 第一次修改免费，之后需要消耗灵石
    if (playerStore.nameChangeCount > 0) {
      if (playerStore.spiritStones < spiritStoneCost) {
        message.error(`灵石不足！修改道号需要${spiritStoneCost}颗灵石`)
        return
      }
      playerStore.spiritStones -= spiritStoneCost
    }
    playerStore.name = newName.value.trim()
    playerStore.nameChangeCount++
    playerStore.saveData()
    message.success(
      playerStore.nameChangeCount === 1 ? '道号修改成功！首次修改免费' : `道号修改成功！消耗${spiritStoneCost}颗灵石`
    )
    newName.value = ''
  }
</script>

<style scoped>
  .save-profile {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding: 12px;
    border: 1px solid rgba(163, 93, 68, 0.2);
    border-radius: 8px;
    background: rgba(163, 93, 68, 0.05);
  }

  .save-profile div {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .save-profile span {
    color: #7c857b;
    font-size: 11px;
  }

  .save-profile b {
    overflow: hidden;
    color: #27322e;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .save-profile-status b {
    color: #6d8977;
  }

  .account-panel {
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid rgba(93, 128, 123, 0.25);
    border-radius: 8px;
    background: rgba(93, 128, 123, 0.06);
  }

  .account-heading,
  .account-user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .account-heading {
    justify-content: space-between;
  }

  .account-heading b,
  .account-heading small {
    display: block;
  }

  .account-heading b {
    color: #27322e;
    font-size: 14px;
  }

  .account-heading small,
  .account-note,
  .account-user-row span {
    color: #7c857b;
    font-size: 11px;
  }

  .account-user-row b {
    margin-right: auto;
    color: #27322e;
  }

  .account-note {
    margin: 0;
    line-height: 1.6;
  }

  @media (max-width: 620px) {
    .save-profile {
      grid-template-columns: 1fr;
    }
  }
</style>
