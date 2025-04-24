// components/ErrorBoundary.tsx
import { useCallback, useState } from 'react'
import {
	ErrorBoundary as ReactErrorBoundary,
	FallbackProps,
} from 'react-error-boundary'
import { ErrorInfo } from 'react'

interface ErrorBoundaryProps {
	children: React.ReactNode
	fallback?: React.ReactNode
}

interface CustomFallbackProps extends FallbackProps {
	errorInfo: ErrorInfo // 使用 React.ErrorInfo
}

async function sendErrorToLogDatabase(
	error: Error,
	errorInfo: ErrorInfo
): Promise<void> {
	try {
		const logData = {
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
			timestamp: new Date().toISOString(),
			url: window.location.href,
			userAgent: navigator.userAgent,
		}
		console.error('sendErrorToLogDatabase', logData, error, errorInfo)
		// await fetch('/api/log-error', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify(logData),
		// });
	} catch (sendError) {
		console.error('发送日志失败:', sendError)
	}
}

const ErrorFallback: React.FC<CustomFallbackProps> = ({
	error,
	errorInfo,
	resetErrorBoundary,
}) => {
	return (
		<div style={{ padding: '20px' }}>
			<h1>
				Shiina Aiiko, Sorry, an error has occurred. We will fix it as soon as we
				can!
			</h1>

			<div
				style={{
					margin: '20px 0 30px 0',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-start',
				}}
			>
				<button onClick={resetErrorBoundary}>Reset</button>
				<a
					href='mailto:shiina@aiiko.club?subject=Error Report'
					style={{
						margin: '0 0 0 10px',
						padding: '8px 16px',
						backgroundColor: 'var(--saki-default-color)',
						color: 'white',
						textDecoration: 'none', // 移除下划线
						display: 'inline-block', // 让 <a> 像按钮一样布局
						borderRadius: '4px',
					}}
				>
					Report this error to us
				</a>
			</div>
			<h3>Reason for error:</h3>
			<p>{error.message}</p>
			{/* <pre>{errorInfo.componentStack}</pre> */}
			<pre
				style={{
					whiteSpace: 'pre-wrap',
					wordBreak: 'break-all',
					maxWidth: '100%',
				}}
				dangerouslySetInnerHTML={{ __html: errorInfo.componentStack || '' }}
			/>
		</div>
	)
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
	children,
	fallback,
}) => {
	const [errorDetails, setErrorDetails] = useState<{
		error: Error
		errorInfo: ErrorInfo
	} | null>(null) // 设置初始值为 null

	const handleError = useCallback(
		(error: Error, info: { componentStack: string }) => {
			console.error('捕获到错误:', error, info)
			setErrorDetails({ error, errorInfo: info as ErrorInfo }) // 更新状态
			sendErrorToLogDatabase(error, info as ErrorInfo).catch((err) =>
				console.error('日志记录出错:', err)
			)
		},
		[]
	)

	const CustomFallbackComponent: React.FC<FallbackProps> = ({
		error,
		resetErrorBoundary,
	}) => {
		// 如果没有错误详情，则不渲染错误界面
		if (!errorDetails) return null
		return fallback ? (
			<>{fallback}</>
		) : (
			<ErrorFallback
				error={errorDetails.error}
				errorInfo={errorDetails.errorInfo}
				resetErrorBoundary={resetErrorBoundary}
			/>
		)
	}

	return (
		<ReactErrorBoundary
			FallbackComponent={CustomFallbackComponent}
			onError={handleError as any}
		>
			{children}
		</ReactErrorBoundary>
	)
}

export default ErrorBoundary
