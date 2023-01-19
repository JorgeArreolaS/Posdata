import EmotionProvider from "./emotion"

const Providers: React.FC<{
  children?: React.ReactNode
}> = ({ children }) => {

  return <>
    <EmotionProvider>
      {children}
    </EmotionProvider>
  </>

}

export default Providers
