import * as React from 'react'

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'saki-dropdown': any
			'saki-menu': any
			'saki-menu-item': any
			'saki-tabs': any
			'saki-tabs-item': any
			'saki-scroll-view': any
			'saki-button': any
			'saki-input': any
			'saki-textarea': any
			'saki-richtext': any
			'saki-context-menu': any
			'saki-context-menu-item': any
			'saki-avatar': any
			'saki-modal': any
			'saki-modal-header': any
			'saki-checkbox': any
			'saki-checkbox-item': any
			'saki-init': any
			'saki-sso-login': any
			'saki-drag-sort': any
			'saki-drag-sort-item': any
			'saki-card': any
			'saki-card-item': any
			'saki-page-container': any
			'saki-page-header': any
			'saki-page-main': any
			'saki-page-main': any
			'saki-modal-buttons': any
			'saki-switch': any
			'meow-apps-dropdown': any
			'saki-base-style': any
			'saki-title': any
		}
	}
	namespace Window {
		electron: any
	}
}
