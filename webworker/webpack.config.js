// 引入path模块,path是node里面的一个包，主要用来拼接路径。
const path = require('path')
// 引入html-webpack-plugin
const htmlWebpackPlugin = require('html-webpack-plugin')

//引入clean-webpack-plugin
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

// 正式编写配置信息
//webpack 中所有配置信息都应该写在这里
module.exports = {
	mode: 'development',
	//指定入口文件
	entry: './webworker/index.ts',
	//指定打包文件所在目录
	output: {
		//指定打包文件所在目录
		path: path.resolve(__dirname, 'dist'),
		//打包后的文件名
		filename: 'webworker-bundle.js',

		//告诉webpack不适用箭头函数
		environment: {
			arrowFunction: false,
		},
	},

	// 指定webpack打包时要使用的模块
	module: {
		// 指定要加载的规则
		rules: [
			{
				//test 指定的时规则生效的文件
				test: /\.ts$/,
				//要使用的loader
				use: [
					//配置babel
					{
						//指定loader
						loader: 'babel-loader',
						options: {
							//设置预定义的环境
							presets: [
								[
									//指定环境插件
									'@babel/preset-env',
									//配置信息
									{
										//指定浏览器版本，要兼容的目标浏览器
										targets: {
											chrome: '88',
											ie: '11',
										},
										//指定corejs版本
										corejs: '3',
										//使用corejs的方式“usage”,表示按需加载
										useBuiltIns: 'usage',
									},
								],
							],
						},
					},
					'ts-loader',
				],
				//要排除的文件
				exclude: /node_modules/,
			},
		],
	},

	//配置webpack 插件
	plugins: [
		// 使用cleanwebpackPlugin
		new CleanWebpackPlugin(),
		//使用htmlWebpackPlugin
		// new htmlWebpackPlugin({
		// 	// title:"土豆奥利奥",
		// 	//定义模板
		// 	template: './plugins/wp/src/index.html',
		// }),
	],

	//用来设置引用模块
	resolve: {
		extensions: ['.ts', '.js'],
	},
}
