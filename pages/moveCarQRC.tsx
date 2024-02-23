import moveCarQRC from './[lang]/moveCarQRC'

export default moveCarQRC

// const createAndUpdateMoveCarQRC = (
//   type: 'Create' | 'Update',
//   mcqrc?: {
//     id?: string
//     phone: string
//     carNumber: string
//     slogan: string
//     email: string
//     wechat: string
//     colorTheme?: string
//   }
// ) => {
//   // let phone = ''
//   // let carNumber = '渝AFG5311'
//   // let slogan = '马上走'
//   // let email = ''
//   // let wechat = ''

//   setShowEditQRCModal(true)
//   setEditQRC({
//     type,
//     mcqrc,
//   })

//   // mcqrc?.phone && (phone = mcqrc.phone)
//   // mcqrc?.carNumber && (carNumber = mcqrc.carNumber)
//   // mcqrc?.slogan && (slogan = mcqrc.slogan)
//   // mcqrc?.email && (email = mcqrc.email)
//   // mcqrc?.wechat && (wechat = mcqrc.wechat)

//   // const verfiyNextButton = () => {
//   // 	if (!carNumber || !slogan) {
//   // 		if (!carNumber) {
//   // 			mp1.setInput({
//   // 				label: 'carNumber',
//   // 				type: 'error',
//   // 				v: t('cannotBeEmpty', {
//   // 					ns: 'prompt',
//   // 				}),
//   // 			})
//   // 		}
//   // 		if (!slogan) {
//   // 			mp1.setInput({
//   // 				label: 'slogan',
//   // 				type: 'error',
//   // 				v: t('cannotBeEmpty', {
//   // 					ns: 'prompt',
//   // 				}),
//   // 			})
//   // 		}
//   // 		mp1.setButton({
//   // 			label: 'Create',
//   // 			type: 'disabled',
//   // 			v: true,
//   // 		})
//   // 		return
//   // 	}
//   // 	mp1.setButton({
//   // 		label: 'Create',
//   // 		type: 'disabled',
//   // 		v: false,
//   // 	})
//   // }

//   // const mp1 = multiplePrompts({
//   // 	title:
//   // 		type === 'Create'
//   // 			? t('createMoveCarQRC', {
//   // 					ns: 'prompt',
//   // 			  })
//   // 			: t('updateMoveCarQRC', {
//   // 					ns: 'prompt',
//   // 			  }),
//   // 	multipleInputs: [
//   // 		...(type === 'Update'
//   // 			? ([
//   // 					{
//   // 						label: 'phone',
//   // 						value: phone,
//   // 						placeholder: '* ' + t('typePhone'),
//   // 						type: 'Text',
//   // 						onChange(value: any) {
//   // 							phone = value.trim()
//   // 							mp1.setInput({
//   // 								label: 'phone',
//   // 								type: 'error',
//   // 								v: '',
//   // 							})
//   // 							verfiyNextButton()
//   // 						},
//   // 					},
//   // 			  ] as any)
//   // 			: []),
//   // 		{
//   // 			label: 'carNumber',
//   // 			value: carNumber,
//   // 			placeholder: '* ' + t('typeCarNumber'),
//   // 			type: 'Text',
//   // 			onChange(value) {
//   // 				carNumber = value.trim()
//   // 				mp1.setInput({
//   // 					label: 'carNumber',
//   // 					type: 'error',
//   // 					v: '',
//   // 				})
//   // 				verfiyNextButton()
//   // 			},
//   // 		},
//   // 		{
//   // 			label: 'slogan',
//   // 			value: slogan,
//   // 			placeholder: '* ' + t('typeSlogan'),
//   // 			type: 'Text',
//   // 			onChange(value) {
//   // 				slogan = value.trim()
//   // 				mp1.setInput({
//   // 					label: 'slogan',
//   // 					type: 'error',
//   // 					v: '',
//   // 				})
//   // 				verfiyNextButton()
//   // 			},
//   // 		},
//   // 		{
//   // 			label: 'email',
//   // 			value: email,
//   // 			placeholder: t('typeEmail'),
//   // 			type: 'Text',
//   // 			onChange(value) {
//   // 				email = value.trim()
//   // 				mp1.setInput({
//   // 					label: 'email',
//   // 					type: 'error',
//   // 					v: '',
//   // 				})
//   // 				return
//   // 			},
//   // 		},
//   // 		{
//   // 			label: 'wechat',
//   // 			value: wechat,
//   // 			placeholder: t('typeWechat'),
//   // 			type: 'Text',
//   // 			onChange(value) {
//   // 				wechat = value.trim()
//   // 				mp1.setInput({
//   // 					label: 'wechat',
//   // 					type: 'error',
//   // 					v: '',
//   // 				})
//   // 				return
//   // 			},
//   // 		},
//   // 	],
//   // 	closeIcon: true,
//   // 	flexButton: true,
//   // 	buttons: [
//   // 		{
//   // 			label: 'Cancel',
//   // 			text: t('cancel', {
//   // 				ns: 'prompt',
//   // 			}),
//   // 			type: 'Normal',
//   // 			async onTap() {
//   // 				mp1.close()
//   // 			},
//   // 		},
//   // 		{
//   // 			label: 'Create',
//   // 			text:
//   // 				type === 'Create'
//   // 					? t('create', {
//   // 							ns: 'prompt',
//   // 					  })
//   // 					: t('update', {
//   // 							ns: 'prompt',
//   // 					  }),
//   // 			type: 'Primary',
//   // 			// disabled: true,
//   // 			async onTap() {
//   // 				verfiyNextButton()
//   // 				mp1.setButton({
//   // 					label: 'Create',
//   // 					type: 'loading',
//   // 					v: true,
//   // 				})
//   // 				mp1.setButton({
//   // 					label: 'Create',
//   // 					type: 'disabled',
//   // 					v: true,
//   // 				})

//   // 				if (type === 'Create') {
//   // 					const res = await httpApi.MoveCarQRC.CreateMoveCarQRC({
//   // 						phone,
//   // 						carNumber,
//   // 						slogan,
//   // 						email,
//   // 						wechat,
//   // 					})

//   // 					console.log('CreateMoveCarQRC', res)
//   // 					if (res.code === 200) {
//   // 						setMoveCarQRCList([])
//   // 						setPageNum(1)
//   // 						setLoadStatus('loaded')
//   // 						mp1.close()
//   // 						showSnackbar(
//   // 							t('createSuccessfully', {
//   // 								ns: 'prompt',
//   // 							})
//   // 						)

//   // 						return
//   // 					}
//   // 				}
//   // 				if (type === 'Update' && mcqrc?.id) {
//   // 					console.log('update')
//   // 					const res = await httpApi.MoveCarQRC.UpdateMoveCarQRC(mcqrc?.id, {
//   // 						phone,
//   // 						carNumber,
//   // 						slogan,
//   // 						email,
//   // 						wechat,
//   // 					})
//   // 					console.log('UpdateMoveCarQRC', res)
//   // 					if (res.code === 200) {
//   // 						setMoveCarQRCList(
//   // 							moveCarQRCList.map((v) => {
//   // 								if (v.id === mcqrc?.id) {
//   // 									return {
//   // 										...v,
//   // 										...res.data.moveCarQRC,
//   // 									}
//   // 								}
//   // 								return v
//   // 							})
//   // 						)
//   // 						setPageNum(1)
//   // 						setLoadStatus('loaded')
//   // 						mp1.close()
//   // 						showSnackbar(
//   // 							t('updateSuccessfully', {
//   // 								ns: 'prompt',
//   // 							})
//   // 						)
//   // 						return
//   // 					}
//   // 				}

//   // 				mp1.setButton({
//   // 					label: 'Create',
//   // 					type: 'disabled',
//   // 					v: false,
//   // 				})
//   // 				mp1.setButton({
//   // 					label: 'Create',
//   // 					type: 'loading',
//   // 					v: false,
//   // 				})
//   // 			},
//   // 		},
//   // 	],
//   // })
//   // mp1.open()
// }