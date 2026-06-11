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
          style={[
              styles.inputBox,
              errors.email ? {marginBottom: 0} : {marginBottom: 20}
            ]}
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
            placeholderTextColor={"#9e9e9e"}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Text style={styles.errorText}>
              {errors.email}
            </Text>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
          style={[
              styles.inputBox,
              errors.password ? {marginBottom: 0} : {marginBottom: 20}
            ]}
          value={formData.password}
          onChangeText={text => {
              setFormData(prev => ({
                ...prev,
                password: text
              }));

              if (errors.password) {
                setErrors(prev => ({
                  ...prev,
                  password: undefined,
                }));
              }
            }}
            placeholder="Enter password"
            placeholderTextColor={"#9e9e9e"}
            secureTextEntry
          />
          {errors.password && (
            <Text style={styles.errorText}>
              {errors.password}
            </Text>
          )}

          <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
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