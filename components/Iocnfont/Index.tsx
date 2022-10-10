import React, { memo } from 'react'

interface ListProps {
	type: string
	className?: string
	style?: any
	onClick?: (ev: React.MouseEvent<HTMLSpanElement>) => void
}

function Iconfont(props: ListProps) {
	const { type, className, onClick, style } = props
	return (
		{ type } && (
			<i
				className={`iconfont ${type} ${className}`}
				style={style}
				onClick={(ev) => {
					if (onClick) {
						onClick(ev)
					}
				}}
			></i>
		)
	)
}
export default memo(Iconfont)
