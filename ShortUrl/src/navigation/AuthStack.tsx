import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
//Screens
import SignIn from '../screens/SignIn/SignIn';
import SignUp from '../screens/SignUp/SignUp';

export type AuthStackParamList = {
    SignIn: undefined;
    SignUp: undefined;
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

const AuthStack = () => {
  return (
    <NavigationContainer>
        <Stack.Navigator
        initialRouteName='SignIn'
        screenOptions={{
          statusBarTranslucent: true,
          headerShown: false,
          animation: "flip"
        }}
        >
            <Stack.Screen
            name="SignIn"
            component={SignIn}
            />
            <Stack.Screen
            name="SignUp"
            component={SignUp}
            />
        </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AuthStack