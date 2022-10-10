const path = require('path')
module.exports = {
	sassOptions: {
		includePaths: [path.join(__dirname, '.')],
		prependData: `@import "./assets/style/base.scss";`,
	},
	env: {
		CLIENT_ENV: process.env.CLIENT_ENV,
		DOCKER_LOCALHOST: process.env.DOCKER_LOCALHOST,
	},
}
