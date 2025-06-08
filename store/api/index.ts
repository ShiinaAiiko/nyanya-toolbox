import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { server } from '../../config'

export const apiMethods = {}

export const apiSlice = createSlice({
  name: 'api',
  initialState: {
    apiUrl: server.url,
    apiUrls: {
      v1: {
        baseUrl: '/api/v1',
        urlToIp: '/url/toIp',
        ipDetails: '/ip/details',
        getFTShareCode: '/fileTransfer/shareCode/get',
        connectFTRoom: '/fileTransfer/room/connect',
        reconnectFTRoom: '/fileTransfer/room/reconnect',

        // MoveCarQRC
        createMoveCarQRC: '/moveCarQRC/create',
        getMoveCarQRCList: '/moveCarQRC/list/get',
        getMoveCarQRC: '/moveCarQRC/get',
        updateMoveCarQRC: '/moveCarQRC/update',
        deleteMoveCarQRC: '/moveCarQRC/delete',
        sendEmail: '/moveCarQRC/sendEmail',
        updateMoveCarQRCStatistics: '/moveCarQRC/statistics/update',

        // CountdownDays
        getUploadTokenOfCountdownDays: '/countdownDays/uploadToken/get',
        getCountdownDaysFileUrls: '/countdownDays/fileUrls/get',

        // Weather
        getUploadTokenOfWeather: '/weather/uploadToken/get',
        getWeatherFileUrls: '/weather/fileUrls/get',
      },
    },
    nsocketio: {
      namespace: {
        Base: '/',
        FileTransfer: '/fileTransfer',
      },
      routerEventName: {
        JoinedFTRoom: 'JoinedFTRoom',
        ExitedFTRoom: 'ExitedFTRoom',
        Error: 'Error',
      },
      requestEventName: {
        JoinFTRoom: 'JoinFTRoom',
        LeaveFTRoom: 'LeaveFTRoom',
        IncreaseFTRoomTimeLimit: 'IncreaseFTRoomTimeLimit',
        Data: 'Data',
      },
    },
  },
  reducers: {},
  extraReducers: (builder) => {},
})
