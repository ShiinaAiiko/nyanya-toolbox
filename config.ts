import { baselog } from 'nyanyajs-log'
baselog.Info('Env:', process.env.CLIENT_ENV)
let server = {
	url: '',
}
let sakiui = {
	jsurl: '',
	esmjsurl: '',
}
let sakisso = {
	appId: '',
	clientUrl: '',
	serverUrl: '',
}
let meowApps = {
	jsurl: '',
	esmjsurl: '',
}
let webrtc = {
	url: '',
}
let appListUrl = ''

interface Config {
	server: typeof server
	sakiui: typeof sakiui
	sakisso: typeof sakisso
	appListUrl: typeof appListUrl
	meowApps: typeof meowApps
	webrtc: typeof webrtc
}

try {
	let configJson: Config = require('./config.temp.json')
	// let configJson: Config = require('./config.test.json')
	if (configJson) {
		server = configJson.server
		sakiui = configJson.sakiui
		sakisso = configJson.sakisso
		meowApps = configJson.meowApps
		appListUrl = configJson.appListUrl
		webrtc = configJson.webrtc
	}
} catch (error) {
	console.error(error)
}
export { sakiui, appListUrl, meowApps, server, webrtc, sakisso }
export default { sakiui, appListUrl, meowApps, server, webrtc, sakisso }
