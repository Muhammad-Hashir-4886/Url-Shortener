import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import styles from './styles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthStack'
import { signInSchema } from '../../validators/AuthSchema'

type SignInProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>
type Errors = {
  email?: string;
  password?: string;
};

const SignIn = ({navigation}: SignInProps) => {

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Errors>({});

  const handleNavigation = () => {
    navigation.navigate("SignUp")
  }

  const handleSignIn = () => {
    const result = signInSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Errors = {};

      result.error.issues.forEach(error => {
        const field = error.path[0] as keyof Errors;

        fieldErrors[field] = error.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    console.log('Validation Passed');

    // API Call Here
  };


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Sign In</Text>
      <View style={styles.subCont}>

        <View style={styles.form}>
          
          <Text style={styles.label}>Email</Text>
          <TextInput
          style={styles.inputBox}
          value={formData.email}
          onChangeText={text => {
              setFormData(prev => ({
                ...prev,
                email: text
              }));

              if (errors.email) {
                setErrors(prev => ({
                  ...prev,
                  email: undefined,
                }));
              }
            }}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
          style={styles.inputBox}
          value={formData.password}
          />

          <TouchableOpacity
          style={styles.button}
          >
            <Text style={styles.btnText}>
              Sign In
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Don't have an account ?
            <Text 
            style={styles.innerFooter}
            onPress={handleNavigation}
            > Sign Up</Text>
            </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default SignIn