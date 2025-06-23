import {
  createSlice,
  createAsyncThunk,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit'
import exp from 'constants'
// import thunk from 'redux-thunk'
import { useDispatch } from 'react-redux'

import { apiSlice, apiMethods } from './api'
import { userSlice, userMethods } from './user'
import { localUserSlice, localUserMethods } from './localUser'
import { layoutSlice, layoutMethods } from './layout'
import { configSlice, configMethods } from './config'
import { nsocketioSlice, nsocketioMethods } from './nsocketio'
import { fileTransferSlice, fileTransferMethods } from './fileTransfer'
import { webRTCSlice, webRTCMethods } from './webRTC'
import { emojiSlice, emojiMethods } from './emoji'
import { countdownDaysSlice, countdownDaysMethods } from './countdownDays'
import { positionSlice, positionMethods } from './position'

export interface ActionParams<T = any> {
  type: string
  payload: T
}

const rootReducer = combineReducers({
  api: apiSlice.reducer,
  user: userSlice.reducer,
  layout: layoutSlice.reducer,
  config: configSlice.reducer,
  nsocketio: nsocketioSlice.reducer,
  fileTransfer: fileTransferSlice.reducer,
  webRTC: webRTCSlice.reducer,
  emoji: emojiSlice.reducer,
  localUser: localUserSlice.reducer,
  countdownDays: countdownDaysSlice.reducer,
  position: positionSlice.reducer,
})

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export {
  apiSlice,
  userSlice,
  configSlice,
  fileTransferSlice,
  nsocketioSlice,
  layoutSlice,
  webRTCSlice,
  emojiSlice,
  localUserSlice,
  countdownDaysSlice,
  positionSlice,
}
export const methods = {
  api: apiMethods,
  user: userMethods,
  layout: layoutMethods,
  config: configMethods,
  nsocketio: nsocketioMethods,
  fileTransfer: fileTransferMethods,
  webRTC: webRTCMethods,
  emoji: emojiMethods,
  localUser: localUserMethods,
  countdownDays: countdownDaysMethods,
  position: positionMethods,
}

// console.log(store.getState())
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()

export default store
