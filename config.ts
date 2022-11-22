import { baselog } from 'nyanyajs-log'
baselog.Info('Env:', process.env.CLIENT_ENV)
let sakiui = {
	jsurl: '',
	esmjsurl: '',
}
let appListUrl = ''

interface Config {
	sakiui: typeof sakiui
	appListUrl: typeof appListUrl
}

try {
	let configJson: Config = require('./config.temp.json')
	// let configJson: Config = require('./config.test.json')
	if (configJson) {
		sakiui = configJson.sakiui
		appListUrl = configJson.appListUrl
	}
} catch (error) {
	console.error(error)
}
export { sakiui, appListUrl }
export default { sakiui, appListUrl }
