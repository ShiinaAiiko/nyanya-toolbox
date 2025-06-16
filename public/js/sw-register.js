const showAlert = ({
  titleAvatar,
  titleAvatarText,
  title,
  content,
  cancelText,
  confirmText,
  autoHideDuration = 0,
  flexButton = false,
  onCancel,
  onConfirm,
}) => {
  let el
  let isClouse = false
  const api = {
    open() {
      el = document.createElement('saki-dialog-alert')
      el['title'] = title
      el['titleAvatar'] = titleAvatar || ''
      el['titleAvatarText'] = titleAvatarText || ''
      el['title'] = title
      el['content'] = content
      el['cancelText'] = cancelText
      el['confirmText'] = confirmText
      el['autoHideDuration'] = autoHideDuration
      el['flexButton'] = flexButton
      el.addEventListener('load', () => {
        el.open()
        isClouse = false
      })
      el.addEventListener('close', () => {
        console.log('removeChild', el)
        try {
          !isClouse && document.body.removeChild(el)
          isClouse = true
        } catch (error) {
          console.error(error)
        }
      })
      el.addEventListener('cancel', () => {
        onCancel === null || onCancel === void 0 ? void 0 : onCancel()
      })
      el.addEventListener('confirm', () => {
        onConfirm === null || onConfirm === void 0 ? void 0 : onConfirm()
      })
      document.body.appendChild(el)
    },
    close() {
      var _a
      ;(_a = el === null || el === void 0 ? void 0 : el.close) === null ||
      _a === void 0
        ? void 0
        : _a.call(el)
    },
  }
  return api
}

const snackbar = (options) => {
  let el
  const api = {
    open() {
      // console.log(' state.app.status', el)
      if (el) {
        el.open()
        return
      }
      el = document.createElement('saki-snackbar')
      // console.log('state.app.status', el)
      // console.log(el)
      const { onTap } = options
      Object.keys(options).forEach((k) => {
        if (k != 'onTap' && options[k]) {
          el[k] = options[k]
        }
      })
      if (onTap) {
        el['allowContentClick'] = 'true'
        el.addEventListener('tap', () => {
          onTap()
        })
      }
      el.addEventListener('load', () => {
        el.open()
      })
      el.addEventListener('close', () => {
        document.body.contains(el) && document.body.removeChild(el)
        el = null
      })
      document.body.appendChild(el)
    },
    close() {
      el && el.close && el.close()
    },
    setMessage(msg) {
      console.log('elelelel', el)
      if (el) {
        el['message'] = msg
      } else {
        options.message = msg
      }
    },
  }
  return api
}

const i18nJson = {
  'en-US': {
    newVersion: 'New Version!',
    newVersionContent:
      'Version update has been completed. Do you want to refresh the page?',
    refresh: 'Refresh',
    cancel: 'Cancel',
  },
  'zh-CN': {
    newVersion: '新版本！',
    newVersionContent: '已经完成版本更新，是否刷新页面？',
    refresh: '刷新',
    cancel: '取消',
  },
  'zh-TW': {
    newVersion: '新版本！ ',
    newVersionContent: '已經完成版本更新，是否刷新頁面？ ',
    refresh: '刷新',
    cancel: '取消',
  },
}

const t = (k) => {
  let pathnameArr = (location.pathname || '')
    .split('/')
    ?.map((v) => v.trim())
    .filter((v) => v)
  let lang = 'en-US'
  if (pathnameArr.length) {
    lang = pathnameArr?.[0] || 'en-US'
  }
  // console.log('pathnameArr ', pathnameArr, lang, k, i18nJson)

  return i18nJson?.[lang]?.[k] || ''
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // 新版本已安装，提示刷新
            // snackbar({
            // 	message: 'The new version has been updated! Refresh to use.',
            // 	autoHideDuration: 4000,
            // 	vertical: 'top',
            // 	horizontal: 'center',
            // 	backgroundColor: 'var(--saki-default-color)',
            // 	color: '#fff',
            // }).open()

            // snackbar({
            // 	message: t(),
            // 	// autoHideDuration: 4000,
            // 	vertical: 'top',
            // 	horizontal: 'center',
            // 	backgroundColor: 'var(--saki-default-color)',
            // 	color: '#fff',
            // 	onTap() {
            // 		console.log('new version')
            // 		window.location.reload()
            // 	},
            // }).open()

            showAlert({
              title: t('newVersion'),
              content: t('newVersionContent'),
              cancelText: t('cancel'),
              confirmText: t('refresh'),
              onCancel() {},
              onConfirm() {
                window.location.reload()
              },
            }).open()

            // if (confirm('New version available. Refresh now?')) {
            // 	console.log('New version available. Refresh now?')
            // 	window.location.reload()
            // }
          }
        })
      })
    })
  })
}
