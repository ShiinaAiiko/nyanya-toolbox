import React, { ReactNode, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// type PropsType = {
//   children: React.ReactNode | JSX.Element[] | JSX.Element | React.FC
// }

// const NoSSR = dynamic(
//   () =>
//     Promise.resolve(({ children }: propsType) => {
//       return <React.Fragment>{children}</React.Fragment>
//     }),
//   {
//     ssr: false,
//   }
// )
// export default NoSSR

const NoSSR = ({ children }: propsType) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return <>{mounted ? children : ''}</>
}
export default NoSSR
