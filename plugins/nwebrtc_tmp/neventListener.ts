type F<V = any> = (value: V) => void
export class NEventListener<
	T = {
		[event: string]: any
	}
> {
	private handlers: {
		[s: string]: F[]
	} = {}
	constructor() {}
	public on<E extends keyof T>(event: E, func: F<T[E]>) {
		if (!func) return
		let s: string = String(event)
		if (!this.handlers[s]) {
			this.handlers[s] = [func]
		} else {
			this.handlers[s] = this.handlers[s].concat([func])
		}
	}
	public dispatch<E extends keyof T>(event: E, value: T[E]) {
		let s: string = String(event)
		this.handlers[s]?.forEach((v) => {
			v?.(value)
		})
	}
	public removeEvent<E extends keyof T>(event: E) {
		delete this.handlers[String(event)]
	}
	public removeAllEvent() {
		this.handlers = {}
	}
}
