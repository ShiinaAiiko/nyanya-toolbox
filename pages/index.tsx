import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'

const IndexPage = () => {
	const { t, i18n } = useTranslation('')
	const router = useRouter()

	useEffect(() => {
		router.replace('/windowsPathToPosixPath')
	}, [])

	return (
		<>
			<Head>
				<title>
					{t('appTitle', {
						ns: 'common',
					})}
				</title>
			</Head>
			<div></div>
		</>
	)
}

export default IndexPage
