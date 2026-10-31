import { View, Text } from 'react-native'
import React from 'react'

const Main = ({children}:{children:React.ReactNode}) => {
  return (
    <View>
      {children}
    </View>
  )
}

export default Main