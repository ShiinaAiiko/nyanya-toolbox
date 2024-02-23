import {
	createSlice,
	createAsyncThunk,
	combineReducers,
	configureStore,
} from '@reduxjs/toolkit'
import md5 from 'blueimp-md5'
import store, { ActionParams, methods, RootState } from '.'
import { PARAMS, protoRoot } from '../protos'
import axios from 'axios'
import { storage } from './storage'

export const modeName = 'emoji'

export interface CustomStickersItem {
	url: string
	width: number
	height: number
	type: 'image/gif' | 'image/jpeg'
	createTime: number
}

export interface EmojiItem {
	name: string
	src: string
}

const state: {
	customStickers: CustomStickersItem[]
	emojiList: {
		categoryName: string
		list: EmojiItem[]
	}[]
	emojiListObj: {
		[name: string]: EmojiItem
	}
} = {
	customStickers: [],
	emojiList: [
		{
			categoryName: 'recentlyUsed',
			list: [],
		},
		{
			categoryName: 'emoji',
			list: [
				{
					name: 'FaceBlowingAKiss',
					src: '/emoji/face_blowing_a_kiss_color.svg',
				},
				{
					name: 'FaceExhaling',
					src: '/emoji/face_exhaling_color.svg',
				},
				{
					name: 'FaceHoldingBackTears',
					src: '/emoji/face_holding_back_tears_color.svg',
				},
				{
					name: 'FaceInClouds',
					src: '/emoji/face_in_clouds_color.svg',
				},
				{
					name: 'FaceSavoringFood',
					src: '/emoji/face_savoring_food_color.svg',
				},
				{
					name: 'FaceScreamingInFear',
					src: '/emoji/face_screaming_in_fear_color.svg',
				},
				{
					name: 'FaceVomiting',
					src: '/emoji/face_vomiting_color.svg',
				},
				{
					name: 'FaceWithDiagonalMouth',
					src: '/emoji/face_with_diagonal_mouth_color.svg',
				},
				{
					name: 'FaceWithHandOverMouth3d.png',
					src: '/emoji/face_with_hand_over_mouth_3d.png',
				},
				{
					name: 'FaceWithHandOverMouth',
					src: '/emoji/face_with_hand_over_mouth_color.svg',
				},
				{
					name: 'FaceWithHead-bandage',
					src: '/emoji/face_with_head-bandage_color.svg',
				},
				{
					name: 'FaceWithMedicalMask',
					src: '/emoji/face_with_medical_mask_color.svg',
				},
				{
					name: 'FaceWithMonocle',
					src: '/emoji/face_with_monocle_color.svg',
				},
				{
					name: 'FaceWithOpenEyesAndHandOverMouth',
					src: '/emoji/face_with_open_eyes_and_hand_over_mouth_color.svg',
				},
				{
					name: 'FaceWithOpenMouth',
					src: '/emoji/face_with_open_mouth_color.svg',
				},
				{
					name: 'FaceWithPeekingEye',
					src: '/emoji/face_with_peeking_eye_color.svg',
				},
				{
					name: 'FaceWithRaisedEyebrow',
					src: '/emoji/face_with_raised_eyebrow_color.svg',
				},
				{
					name: 'FaceWithRollingEyes',
					src: '/emoji/face_with_rolling_eyes_color.svg',
				},
				{
					name: 'FaceWithSpiralEyes',
					src: '/emoji/face_with_spiral_eyes_color.svg',
				},
				{
					name: 'FaceWithSteamFromNose',
					src: '/emoji/face_with_steam_from_nose_color.svg',
				},
				{
					name: 'FaceWithSymbolsOnMouth',
					src: '/emoji/face_with_symbols_on_mouth_color.svg',
				},
				{
					name: 'FaceWithTearsOfJoy',
					src: '/emoji/face_with_tears_of_joy_color.svg',
				},
				{
					name: 'FaceWithThermometer',
					src: '/emoji/face_with_thermometer_color.svg',
				},
				{ name: 'FaceWithTongue', src: '/emoji/face_with_tongue_color.svg' },
				{
					name: 'FaceWithoutMouth',
					src: '/emoji/face_without_mouth_color.svg',
				},
			],
		},
	],

	emojiListObj: {},
}

state.emojiList.forEach((v) => {
	v.list.forEach((sv) => {
		state.emojiListObj[sv.name] = sv
	})
})

export const emojiSlice = createSlice({
	name: modeName,
	initialState: state,
	reducers: {
		init: (state, params: ActionParams<{}>) => {},
		setCustomStickers: (
			state,
			params: ActionParams<(typeof state)['customStickers']>
		) => {
			state.customStickers = params.payload

			storage.global.setSync('emojicustomStickers', params.payload)
		},
		setEmojiRecentlyUsedList: (state, params: ActionParams<EmojiItem[]>) => {
			state.emojiList.some((v) => {
				if (v.categoryName === 'recentlyUsed') {
					v.list = params.payload
					return true
				}
			})
		},
		setEmojiRecentlyUsed: (state, params: ActionParams<EmojiItem>) => {
			state.emojiList.some((v, i) => {
				if (v.categoryName === 'recentlyUsed') {
					if (v.list.filter((sv) => sv.name === params.payload.name)?.length) {
						v.list.sort((a, b) => {
							return a.name === params.payload.name ? -1 : 1
						})
					} else {
						v.list = [params.payload].concat(v.list)
						if (v.list.length >= 6) {
							v.list = v.list.filter((_, i) => i < 6)
						}
					}
					storage.global.setSync('emojiRecentlyUsed', v.list)
					return true
				}
			})
		},
		removeEmojiRecentlyUsed: (state, params: ActionParams<EmojiItem>) => {
			state.emojiList.some((v, i) => {
				if (v.categoryName === 'recentlyUsed') {
					if (v.list.filter((sv) => sv.name === params.payload.name)?.length) {
						// v.list.sort((a, b) => {
						// 	return a.name === params.payload.name ? -1 : 1
						// })
						v.list = v.list.filter((sv) => sv.name !== params.payload.name)
					}
					storage.global.setSync('emojiRecentlyUsed', v.list)
					return true
				}
			})
		},
	},
})

export const emojiMethods = {
	init: createAsyncThunk(modeName + '/init', async (_, thunkAPI) => {
		thunkAPI.dispatch(
			emojiSlice.actions.setCustomStickers(
				(await storage.global.get('emojicustomStickers')) || []
			)
		)

		thunkAPI.dispatch(
			emojiSlice.actions.setEmojiRecentlyUsedList(
				(await storage.global.get('emojiRecentlyUsed')) || []
			)
		)
	}),
	addCustomSticker: createAsyncThunk(
		modeName + '/addCustomSticker',
		async ({ csi }: { csi: CustomStickersItem }, thunkAPI) => {
			const { emoji } = store.getState()
			let cs = emoji.customStickers.concat(csi)
			thunkAPI.dispatch(emojiSlice.actions.setCustomStickers(cs))
		}
	),
	deleteCustomSticker: createAsyncThunk(
		modeName + '/addCustomSticker',
		async ({ index }: { index: number }, thunkAPI) => {
			const { emoji } = store.getState()
			let cs = emoji.customStickers.filter((_, i) => {
				return i !== index
			})
			thunkAPI.dispatch(emojiSlice.actions.setCustomStickers(cs))
		}
	),
}
