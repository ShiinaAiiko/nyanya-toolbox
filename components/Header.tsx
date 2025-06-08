import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  RootState,
  userSlice,
  AppDispatch,
  layoutSlice,
  methods,
  configSlice,
} from '../store'
import { useTranslation } from 'react-i18next'
import { bindEvent } from '@saki-ui/core'
import { useSelector, useStore, useDispatch } from 'react-redux'
import axios from 'axios'
import { appListUrl, sakisso } from '../config'
import {
  SakiAsideModal,
  SakiAvatar,
  SakiButton,
  SakiCol,
  SakiMenu,
  SakiMenuItem,
  SakiModalHeader,
  SakiRow,
  SakiTitle,
  SakiTemplateHeader,
  SakiTemplateMenuDropdown,
  SakiAnimationLoading,
  SakiSso,
  SakiIcon,
} from './saki-ui-react/components'
import {
  LocalUser,
  getLocalUsers,
  loginLocalUser,
} from '@nyanyajs/utils/dist/sakisso/localUser'
import { userMethods } from '../store/user'
import { localUserMethods } from '../store/localUser'
import moment from 'moment'
import { byteConvert } from '@nyanyajs/utils'
import { copyText, showSnackbar } from '../plugins/methods'

const SpeedComponent = React.memo(() => {
  const { t, i18n } = useTranslation('common')
  const webRTC = useSelector((state: RootState) => state.webRTC)

  const [openNetworkSpeedDropDownMenu, setOpenNetworkSpeedDropDownMenu] =
    useState(false)
  return (
    <saki-dropdown
      visible={openNetworkSpeedDropDownMenu}
      floating-direction="Left"
      z-index="1001"
      ref={bindEvent({
        close: (e) => {
          setOpenNetworkSpeedDropDownMenu(false)
        },
      })}
    >
      <SakiButton
        onTap={() => {
          setOpenNetworkSpeedDropDownMenu(!openNetworkSpeedDropDownMenu)
        }}
        type="Normal"
        border="none"
      >
        <SakiRow margin="0 4px 0 0">
          <SakiCol>
            <span
              style={{
                color: '#666',
                fontSize: '12px',
              }}
            >
              {t('networkSpeed', {
                ns: 'prompt',
                speed:
                  Math.floor((webRTC.transferRate.total / 1024) * 10) / 10 +
                  ' KB/s',
              })}
            </span>
          </SakiCol>
        </SakiRow>
      </SakiButton>
      <div
        style={{
          padding: '10px 12px',
        }}
        className="network-speed-dp-main"
        slot="main"
      >
        <SakiTitle
          margin="0 0 4px 0"
          level={5}
          color="var(--saki-default-color)"
        >
          {t('transferData', {
            ns: 'fileTransferPage',
          })}
        </SakiTitle>
        <div
          style={{
            padding: '2px 0',
            color: '#666',
            fontSize: '12px',
          }}
          className="nsd-item"
        >
          {t('transferData', {
            ns: 'fileTransferPage',
            byte: byteConvert(webRTC.transferData.sent),
          })}
        </div>
        <div
          style={{
            padding: '2px 0',
            color: '#666',
            fontSize: '12px',
          }}
          className="nsd-item"
        >
          {t('downloadedData', {
            ns: 'fileTransferPage',
            byte: byteConvert(webRTC.transferData.received),
          })}
        </div>
        <SakiTitle
          margin="6px 0 4px 0"
          level={5}
          color="var(--saki-default-color)"
        >
          {t('transferRate', {
            ns: 'fileTransferPage',
          })}
        </SakiTitle>
        <div
          style={{
            padding: '2px 0',
            color: '#666',
            fontSize: '12px',
          }}
          className="nsd-item"
        >
          {t('uploadData', {
            ns: 'fileTransferPage',
            byte:
              Math.floor((webRTC.transferRate.sent / 1024) * 10) / 10 + ' KB/s',
          })}
        </div>
        <div
          style={{
            padding: '2px 0',
            color: '#666',
            fontSize: '12px',
          }}
          className="nsd-item"
        >
          {t('downloadData', {
            ns: 'fileTransferPage',
            byte:
              Math.floor((webRTC.transferRate.total / 1024) * 10) / 10 +
              ' KB/s',
          })}
        </div>
      </div>
    </saki-dropdown>
  )
})

const HeaderComponent = ({
  // 暂时仅fixed可用
  visible = true,
  fixed = false,
}: {
  visible: boolean
  fixed: boolean
}) => {
  const { t, i18n } = useTranslation('common')
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const store = useStore()
  const dispatch = useDispatch<AppDispatch>()

  const router = useRouter()
  const { redirectUri, deviceId, appId, disableHeader } = router.query
  const layout = useSelector((state: RootState) => state.layout)
  const config = useSelector((state: RootState) => state.config)
  const user = useSelector((state: RootState) => state.user)
  const localUser = useSelector((state: RootState) => state.localUser)
  const fileTransfer = useSelector((state: RootState) => state.fileTransfer)
  const countdownDays = useSelector((state: RootState) => state.countdownDays)

  const [openUserDropDownMenu, setOpenUserDropDownMenu] = useState(false)
  const [openLoginUserModal, setOpenLoginUserModal] = useState(false)
  const [openUserProfileModal, setOpenUserProfileModal] = useState(false)

  const [localUsers, setLocalUsers] = useState([] as LocalUser[])
  return (
    <SakiTemplateHeader visible={visible} fixed={fixed}>
      <div slot="left">
        <SakiTemplateMenuDropdown
          ref={(e) => {
            // console.log('routerrr', router)

            e?.setAppList?.(
              config.appList.map((v) => {
                let url = v.url.replace(
                  'tools.aiiko.club/',
                  'tools.aiiko.club/' +
                    (router.query.lang ? router.query.lang + '/' : '')
                )
                if (mounted) {
                  url = url.replace(
                    'https://tools.aiiko.club',
                    location?.origin.indexOf('192.168.') >= 0
                      ? location?.origin
                      : 'https://tools.aiiko.club'
                  )
                }
                return {
                  ...v,
                  url,
                }
              })
            )
          }}
          openNewPage={!config.pwaApp}
          app-text={layout.headerLogoText}
        ></SakiTemplateMenuDropdown>
      </div>
      <div slot={'center'}></div>
      <div slot={'right'}>
        {router.asPath.indexOf('fileTransfer') >= 0 &&
        fileTransfer.shareCode ? (
          <SpeedComponent />
        ) : (
          ''
        )}
        {layout.headerLoading.loading ? (
          <SakiRow alignItems="center">
            <SakiAnimationLoading />
            {layout.headerLoading.text ? (
              <span
                style={{
                  margin: '0 6px 0 6px',
                  color: '#999',
                  fontSize: '12px',
                  textAlign: 'right',
                }}
              >
                {layout.headerLoading.text}
              </span>
            ) : (
              ''
            )}
          </SakiRow>
        ) : (
          ''
        )}
        {router.asPath.indexOf('moveCarQRC/detail') >= 0 ? (
          <SakiButton
            onTap={() => {
              dispatch(layoutSlice.actions.setOpenStatisticsModal(true))
            }}
            type="Normal"
            border="none"
          >
            <saki-icon color="#666" type="Statistics"></saki-icon>
          </SakiButton>
        ) : (
          ''
        )}
        <SakiButton
          onTap={() => {
            const ns =
              router.pathname
                .replace('/[lang]', '')
                .split('/')
                .filter((v) => v)?.[0] + 'Page'
            console.log('pageTitle', router, ns)
            copyText(`${t('pageTitle', { ns })}
${location.href}`)
            showSnackbar(
              t('copySuccessfully', {
                ns: 'prompt',
              })
            )
          }}
          type="CircleIconGrayHover"
        >
          <saki-icon
            margin="0 6px 0 0"
            width="16px"
            height="16px"
            color="#666"
            padding="0 0 0 5px"
            type="ShareFill"
          ></saki-icon>
        </SakiButton>
        {/* <SakiButton type='CircleIconGrayHover'>
					<saki-icon color='#666' type='ShareFill'></saki-icon>
				</SakiButton> */}
        <meow-apps-dropdown
          ref={(e: any) => {
            // e?.addApps(
            // 	{
            // 		categoryId: ['Toolbox'],
            // 		appName: {
            // 			'zh-CN': '挪车二维码111',
            // 			'zh-TW': '挪車二維碼',
            // 			'en-US': 'Move Car QR Code',
            // 		},
            // 		url: 'https://tools.aiiko.club/moveCarQRC',
            // 		description:
            // 			'免费获取、随时修改、永久使用，将二维码贴在车窗上，即可通过扫描该二维码联系到车主。',
            // 		showInDropdown: true,
            // 		logo: user.userInfo.avatar,
            // 		tags: ['Next', 'Golang', 'SakiUI'],
            // 		titleTag: ['Next', 'Golang'],
            // 		author: 'Shiina Aiiko',
            // 		authorUrl: 'https://aiiko.club/1',
            // 		introduction:
            // 			'<p>免费获取、随时修改、永久使用，将二维码贴在车窗上，即可通过扫描该二维码联系到车主。<p>',
            // 	},
            // 	-1
            // )
          }}
          bg-color="rgba(0,0,0,0)"
          language={config.lang}
        ></meow-apps-dropdown>
        {config.ssoAccount ? (
          <saki-dropdown
            visible={openUserDropDownMenu}
            floating-direction="Left"
            z-index="1001"
            ref={bindEvent({
              close: (e) => {
                setOpenUserDropDownMenu(false)
              },
            })}
          >
            <div
              onClick={() => {
                // onSettings?.('Account')
                setOpenUserDropDownMenu(!openUserDropDownMenu)
                // setOpenUserDropDownMenu(!openUserDropDownMenu)
              }}
              className="tb-h-r-user"
            >
              <saki-avatar
                ref={bindEvent({
                  tap: () => {
                    // setOpenUserDropDownMenu(!openUserDropDownMenu)
                    // onSettings?.()
                    // store.dispatch(userSlice.actions.logout({}))
                  },
                })}
                className="qv-h-r-u-avatar"
                width="34px"
                height="34px"
                border-radius="50%"
                margin="0 0 0 6px"
                default-icon={'UserLine'}
                // anonymous-icon
                nickname={user.userInfo?.nickname || ''}
                src={user.userInfo?.avatar || ''}
                alt=""
              />
              {/* {user.isLogin ? (
							) : (
								<saki-button
									ref={bindEvent({
										tap: async () => {
											setOpenUserDropDownMenu(!openUserDropDownMenu)
										},
									})}
									margin='0 0 0 6px'
									padding='8px 18px'
									font-size='14px'
									type='Primary'
								>
									{t('login', {
										ns: 'prompt',
									})}
								</saki-button>
							)} */}
            </div>
            <div slot="main">
              <saki-menu
                ref={bindEvent({
                  selectvalue: async (e) => {
                    console.log(e.detail.value)
                    switch (e.detail.value) {
                      case 'Login':
                        dispatch(layoutSlice.actions.setOpenLoginModal(true))
                        break
                      case 'Logout':
                        dispatch(methods.user.logout())
                        break
                      case 'Account':
                        setOpenUserProfileModal(true)
                        break

                      default:
                        break
                    }
                    setOpenUserDropDownMenu(false)
                  },
                })}
              >
                {!user.isLogin ? (
                  <saki-menu-item padding="10px 18px" value={'Login'}>
                    <SakiRow justifyContent="flex-start" alignItems="center">
                      <SakiCol>
                        <saki-icon
                          width="20px"
                          color="#666"
                          margin="0 10px 0 0"
                          type="User"
                        ></saki-icon>
                      </SakiCol>
                      <SakiCol>
                        <span>
                          {t('login', {
                            ns: 'prompt',
                          })}
                        </span>
                      </SakiCol>
                    </SakiRow>
                  </saki-menu-item>
                ) : (
                  ''
                )}
                {user.isLogin ? (
                  <>
                    <saki-menu-item padding="10px 18px" value={'Account'}>
                      <SakiRow justifyContent="flex-start" alignItems="center">
                        <SakiCol>
                          <SakiAvatar
                            className="qv-h-r-u-avatar"
                            width="20px"
                            height="20px"
                            margin="0 10px 0 0"
                            border-radius="50%"
                            nickname={user.userInfo?.nickname || ''}
                            src={user.userInfo?.avatar || ''}
                          />
                        </SakiCol>
                        <SakiCol>
                          <span className="text-elipsis">
                            {user.userInfo?.nickname}
                          </span>
                        </SakiCol>
                      </SakiRow>
                    </saki-menu-item>
                  </>
                ) : (
                  ''
                )}
                {user.isLogin ? (
                  <saki-menu-item padding="10px 18px" value={'Logout'}>
                    <SakiRow justifyContent="flex-start" alignItems="center">
                      <SakiCol>
                        <saki-icon
                          width="20px"
                          color="#666"
                          margin="0 10px 0 0"
                          type="Logout"
                        ></saki-icon>
                      </SakiCol>
                      <SakiCol>
                        <span>
                          {t('logout', {
                            ns: 'prompt',
                          })}
                        </span>
                      </SakiCol>
                    </SakiRow>
                  </saki-menu-item>
                ) : (
                  ''
                )}
              </saki-menu>
            </div>
          </saki-dropdown>
        ) : router.asPath.indexOf('fileTransfer') >= 0 ? (
          <saki-dropdown
            visible={openUserDropDownMenu}
            floating-direction="Left"
            z-index="1001"
            ref={bindEvent({
              close: (e) => {
                setOpenUserDropDownMenu(false)
              },
            })}
          >
            <div
              onClick={() => {
                // onSettings?.('Account')
                setOpenUserDropDownMenu(!openUserDropDownMenu)
              }}
              className="tb-h-r-user"
            >
              <saki-avatar
                ref={bindEvent({
                  tap: () => {
                    // onSettings?.()
                    // store.dispatch(userSlice.actions.logout({}))
                  },
                })}
                className="qv-h-r-u-avatar"
                width="34px"
                height="34px"
                border-radius="50%"
                margin="0 0 0 6px"
                nickname={localUser.localUser?.nickname || ''}
                src={localUser.localUser?.avatar || ''}
                alt=""
              />
            </div>
            <div slot="main">
              <saki-menu
                ref={bindEvent({
                  selectvalue: async (e) => {
                    console.log(e.detail.value)
                    switch (e.detail.value) {
                      case 'Login':
                        // 先选择，没有再创建

                        const users = await getLocalUsers()
                        if (!users.length) {
                          dispatch(localUserMethods.createLocalUser())
                        } else {
                          setLocalUsers(users)
                          setOpenLoginUserModal(true)
                        }
                        break
                      case 'Logout':
                        dispatch(userMethods.logout())
                        break
                      case 'Account':
                        break

                      default:
                        break
                    }
                    setOpenUserDropDownMenu(false)
                  },
                })}
              >
                {!user.isLogin ? (
                  <saki-menu-item padding="10px 18px" value={'Login'}>
                    <SakiRow justifyContent="flex-start" alignItems="center">
                      <SakiCol>
                        <saki-icon
                          width="20px"
                          color="#666"
                          margin="0 10px 0 0"
                          type="User"
                        ></saki-icon>
                      </SakiCol>
                      <SakiCol>
                        <span>
                          {t('login', {
                            ns: 'prompt',
                          })}
                        </span>
                      </SakiCol>
                    </SakiRow>
                  </saki-menu-item>
                ) : (
                  ''
                )}
                {user.isLogin ? (
                  <>
                    <saki-menu-item padding="10px 18px" value={'Account'}>
                      <SakiRow justifyContent="flex-start" alignItems="center">
                        <SakiCol>
                          <SakiAvatar
                            className="qv-h-r-u-avatar"
                            width="20px"
                            height="20px"
                            margin="0 10px 0 0"
                            border-radius="50%"
                            nickname={localUser.localUser?.nickname || ''}
                            src={localUser.localUser?.avatar || ''}
                          />
                        </SakiCol>
                        <SakiCol>
                          <span className="text-elipsis">
                            {localUser.localUser?.nickname}
                          </span>
                        </SakiCol>
                      </SakiRow>
                    </saki-menu-item>
                  </>
                ) : (
                  ''
                )}
                {user.isLogin ? (
                  <saki-menu-item padding="10px 18px" value={'Logout'}>
                    <SakiRow justifyContent="flex-start" alignItems="center">
                      <SakiCol>
                        <saki-icon
                          width="20px"
                          color="#666"
                          margin="0 10px 0 0"
                          type="Logout"
                        ></saki-icon>
                      </SakiCol>
                      <SakiCol>
                        <span>
                          {t('logout', {
                            ns: 'prompt',
                          })}
                        </span>
                      </SakiCol>
                    </SakiRow>
                  </saki-menu-item>
                ) : (
                  ''
                )}
              </saki-menu>
            </div>
          </saki-dropdown>
        ) : (
          ''
        )}
        <SakiAsideModal
          onClose={() => {
            setOpenLoginUserModal(false)
          }}
          vertical="Center"
          horizontal="Center"
          mask
          // mask-closable
          visible={openLoginUserModal}
          width="300px"
          background-color="#fff"
          border-radius="10px"
          padding="0px 0"
          margin="0px"
        >
          <div>
            {openLoginUserModal ? (
              <>
                {' '}
                {/* <SakiModalHeader
									close-icon={true}
									onClose={() => {
										setOpenLoginUserModal(false)
									}}
									title={'选择一个本地用户'}
								/> */}
                <SakiTitle level={5} color="#666" padding="10px 20px 0">
                  <span>已创建的用户</span>
                </SakiTitle>
                {localUsers.length ? (
                  <SakiMenu
                    onSelectvalue={async (e) => {
                      console.log(e.detail.value)
                      switch (e.detail.value) {
                        case 'Cancel':
                          break

                        default:
                          await loginLocalUser(e.detail.value)
                          await dispatch(localUserMethods.login())
                          break
                      }
                      setOpenLoginUserModal(false)
                    }}
                  >
                    {localUsers.map((v, i) => {
                      return (
                        <SakiMenuItem key={i} padding="10px 18px" value={v.uid}>
                          <SakiRow alignItems="center">
                            <SakiCol>
                              <SakiRow alignItems="center">
                                <SakiCol>
                                  <SakiAvatar
                                    className="qv-h-r-u-avatar"
                                    width="30px"
                                    height="30px"
                                    margin="0 10px 0 0"
                                    border-radius="50%"
                                    nickname={v.nickname}
                                    src={v.avatar}
                                  />
                                </SakiCol>
                                <SakiCol>
                                  <span
                                    style={{
                                      fontSize: '16px',
                                    }}
                                    className="text-elipsis"
                                  >
                                    {v.nickname}
                                  </span>
                                </SakiCol>
                              </SakiRow>
                            </SakiCol>
                            <SakiCol>
                              <span
                                style={{
                                  fontSize: '12px',
                                }}
                                className="text-elipsis"
                              >
                                {moment(v.lastLoginTime * 1000).fromNow()}
                              </span>
                            </SakiCol>
                          </SakiRow>
                        </SakiMenuItem>
                      )
                    })}
                    <SakiMenuItem padding="10px 18px" value={'Cancel'}>
                      <span
                        style={{
                          textAlign: 'center',
                        }}
                        className="text-elipsis"
                      >
                        取消登录
                      </span>
                    </SakiMenuItem>
                  </SakiMenu>
                ) : (
                  ''
                )}
              </>
            ) : (
              ''
            )}
          </div>
        </SakiAsideModal>
        <saki-modal
          max-width={config.deviceType === 'Mobile' ? '100%' : '800px'}
          min-width={config.deviceType === 'Mobile' ? 'auto' : '700px'}
          max-height={config.deviceType === 'Mobile' ? '100%' : '600px'}
          min-height={config.deviceType === 'Mobile' ? 'auto' : '400px'}
          width="100%"
          height="100%"
          border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
          border={config.deviceType === 'Mobile' ? 'none' : ''}
          mask
          background-color="#fff"
          onClose={() => {
            setOpenUserProfileModal(false)
          }}
          visible={openUserProfileModal}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <saki-modal-header
              ref={bindEvent({
                close: (e) => {
                  setOpenUserProfileModal(false)
                },
              })}
              closeIcon
              title={t('profile', {
                ns: 'prompt',
              })}
            />
            {openUserProfileModal ? (
              <SakiSso
                onUpdateUser={async (e) => {
                  await dispatch(
                    methods.user.checkToken({
                      token: user.token,
                      deviceId: user.deviceId,
                    })
                  )
                }}
                disable-header
                style={{
                  flex: '1',
                }}
                class="disabled-dark"
                app-id={sakisso.appId}
                language={config.language}
                appearance={''}
                // url={"https://aiiko.club"}
                url={sakisso.clientUrl + '/profile'}
              />
            ) : (
              ''
            )}
          </div>
        </saki-modal>
      </div>
    </SakiTemplateHeader>
  )
}

export default HeaderComponent
