import { View, Text } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Icon from "react-native-vector-icons/MaterialIcons";
//screens
import EditUrl from '../screens/EditUrl/EditUrl'
import Home from '../screens/Home/Home'
import Profile from '../screens/Profile/Profile'
import CreateUrl from '../screens/CreateUrl/CreateUrl'

export type RootStackParamList = {
    Tabs: undefined;
    EditUrl: undefined;
}
export type RootTopParamList = {
    Profile: undefined;
    Home: undefined;
    CreateUrl: undefined;
}

const TopTab = createMaterialTopTabNavigator<RootTopParamList>()
const Stack = createNativeStackNavigator<RootStackParamList>()

const AppStack = () => {

    function TopTabs() {
        return (
            <TopTab.Navigator
            initialRouteName='Home'
            screenOptions={({route}) => ({
                tabBarStyle: {
                    backgroundColor: "#277ddf",
                    paddingTop: 40,
                },
                tabBarLabelStyle: {color: "#FFFFFF", fontSize: 12},
                tabBarIcon: ({color}) => {
                    let icon = "";
                    if(route.name === "Profile"){
                        icon = "account-circle"
                    }else if(route.name === "Home"){
                        icon = "home"
                    }else if(route.name === "CreateUrl"){
                        icon = "add-circle-outline"
                    }else{
                        icon = "circle"
                    }
                    return <Icon name={icon} color={color} size={35}/>
                },
                tabBarActiveTintColor: "#FFFFFF"
            })}
            >
                <TopTab.Screen 
                name='Profile' 
                component={Profile}
                />
                <TopTab.Screen 
                name='Home' 
                component={Home}
                />
                <TopTab.Screen 
                name='CreateUrl' 
                component={CreateUrl} 
                options={{tabBarLabel: 'Create'}}
                />
            </TopTab.Navigator>
        )
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
            initialRouteName='Tabs'
            screenOptions={{
                headerShown: false,
                statusBarHidden: true,
            }}
            >
                <Stack.Screen name='Tabs' component={TopTabs} />
                <Stack.Screen name='EditUrl' component={EditUrl}/>
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default AppStack