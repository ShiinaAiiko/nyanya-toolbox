var path = require('path')
var fs = require('fs')
var dirs = []
var pathName =
	'/home/shiina_aiiko/Workspace/Development/@Aiiko/ShiinaAiikoDevWorkspace/@OpenSourceProject/shiina_aiiko/meow-whisper-core/example/meow-whisper-core-web-chat-demo/public/emoji'

const letters = (v, i) => {
	console.log(v.split(' '))
	return v
		.split(' ')
		.map((v) => {
			return v.substring(0, 1).toUpperCase() + v.substring(1, v.length)
		})
		.join('')
}

fs.readdir(pathName, function (err, files) {
	console.log(
		files.map((v) => {
			let t = v.replace(/_/g, ' ').replace(/ color.svg/g, ' ')
			return {
				name: letters(t),
				src: './emoji/' + v,
			}
		})
	)

	// for (var i = 0; i < files.length; i++) {
	// 	fs.stat(path.join(pathName, files[i]), function (err, data) {
	// 		if (data.isFile()) {
	// 			dirs.push(files[i])
	// 		}
	// 	})
	// }
	// console.log(dirs)
})
