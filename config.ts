import { baselog } from 'nyanyajs-log'
baselog.Info('Env:', process.env.CLIENT_ENV)
let server = {
	url: '',
}
let sakiui = {
	jsurl: '',
	esmjsurl: '',
}
let meowApps = {
	jsurl: '',
	esmjsurl: '',
}
let appListUrl = ''

interface Config {
	server: typeof server
	sakiui: typeof sakiui
	appListUrl: typeof appListUrl
	meowApps: typeof meowApps
}

try {
	let configJson: Config = require('./config.temp.json')
	// let configJson: Config = require('./config.test.json')
	if (configJson) {
		server = configJson.server
		sakiui = configJson.sakiui
		meowApps = configJson.meowApps
		appListUrl = configJson.appListUrl
	}
} catch (error) {
	console.error(error)
}
export { sakiui, appListUrl, meowApps, server }
export default { sakiui, appListUrl, meowApps, server }
