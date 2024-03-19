const path = require('path')

const runtimeCaching = require('next-pwa/cache')
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	runtimeCaching: [],
	publicExcludes: [], // like this
	// publicExcludes: ['!**/*'], // like this
	buildExcludes: [() => true],
	fallbacks: false,
	cacheStartUrl: true,
	dynamicStartUrl: true,
	disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
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
})
