import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import styles from './styles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthStack'

type SignUpProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>

const SignIn = ({navigation}: SignUpProps) => {

  const [email, setEmail] = useState<string>('');

  const handleNavigation = () => {
    navigation.navigate("SignIn")
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Sign Up</Text>

      <View style={styles.subCont}>
        <View
        style={styles.form}
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
          style={styles.inputBox}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
          style={styles.inputBox}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
          style={styles.inputBox}
          />

          <TouchableOpacity
          style={styles.button}
          >
            <Text style={styles.btnText}>
              Sign In
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Already have an account ?
            <Text 
            style={styles.innerFooter}
            onPress={handleNavigation}
            > Sign In</Text>
            </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default SignIn