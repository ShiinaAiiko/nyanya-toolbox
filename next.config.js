const path = require('path')
module.exports = {
	...(process.env.OUTPUT === 'export'
		? {
				output: 'export',
		  }
		: {}),
	trailingSlash: false,
	reactStrictMode: false,
	swcMinify: false,
	sassOptions: {
		includePaths: [path.join(__dirname, '.')],
		prependData: `@import "./assets/style/base.scss";`,
	},
	env: {
		DEFAULT_LANGUAGE: 'en-US',
		CLIENT_ENV: process.env.CLIENT_ENV,
		DOCKER_LOCALHOST: process.env.DOCKER_LOCALHOST,
	},
}
