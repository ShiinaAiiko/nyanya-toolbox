// import killerSudoku from '../plugins/killerSudoku'

import { WebWorker } from '@nyanyajs/utils/dist/webWorker'

let stopwatch = 0
let stopwatchTimer: NodeJS.Timeout

WebWorker.onMessage<'stopwatch-start'>((method, params) => {
	console.log(method)
	if (method === 'stopwatch-start') {
		stopwatchTimer && clearInterval(stopwatchTimer)
		stopwatchTimer = setInterval(() => {
			stopwatch += 10
			WebWorker.postMessage('stopwatch-time', {
				time: stopwatch,
			})
		}, 10)
		WebWorker.postMessage(method, {})
		return
	}
	if (method === 'stopwatch-pause') {
		clearInterval(stopwatchTimer)
		WebWorker.postMessage(method, {})
		return
	}
	if (method === 'stopwatch-clear') {
		stopwatch = 0
		WebWorker.postMessage('stopwatch-time', {
			time: stopwatch,
		})
		WebWorker.postMessage(method, {})
		return
	}
})
