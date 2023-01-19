import { Global } from '@emotion/react'
import tw, { css, GlobalStyles as BaseStyles } from 'twin.macro'

const customStyles = css`
    ::-webkit-scrollbar {
      width: 7px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: #ffffff05; 
    }
     
    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #fff3; 
      cursor: pointer;
      border-radius: 8px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
      background: #fff5; 
    }

    .red{
      color: red;
    }
  html, body, body>div { 
    ${tw` h-full `} 
  };

  body {
    ${tw`antialiased overflow-hidden p-0 m-0 `};
  }

  html,
  body {
    ${tw` dark:bg-[#05111a] dark:text-white `}
  }
  main {
    ${tw` overflow-y-auto h-full `}
  }
`

const GlobalStyles = () => (
  <>
    <BaseStyles />
    <Global styles={customStyles} />
  </>
)

export default GlobalStyles
