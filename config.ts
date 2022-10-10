import { baselog } from 'nyanyajs-log'
baselog.Info('Env:', process.env.CLIENT_ENV)
let sakiui = {
	jsurl: '',
	esmjsurl: '',
}

interface Config {
	sakiui: typeof sakiui
}

try {
	let configJson: Config = require('./config.temp.json')
	// let configJson: Config = require('./config.test.json')
	if (configJson) {
		sakiui = configJson.sakiui
	}
} catch (error) {
	console.error(error)
}
export { sakiui }
export default { sakiui }
