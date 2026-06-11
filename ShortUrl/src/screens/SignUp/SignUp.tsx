import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import styles from './styles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../../navigation/AuthStack'
import { signUpSchema } from '../../validators/AuthSchema'

type SignUpProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>
type Errors = {
  name?: string;
  email?: string;
  password?: string;
};

const SignIn = ({ navigation }: SignUpProps) => {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  const handleNavigation = () => {
    navigation.navigate("SignIn")
  };

  const handleSignUp = () => {
    const result = signUpSchema.safeParse(formData);

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
      <Text style={styles.heading}>Sign Up</Text>

      <View style={styles.subCont}>

        <View
          style={styles.form}
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[
              styles.inputBox,
              errors.name ? {marginBottom: 0} : {marginBottom: 20}
            ]}
            value={formData.name}
            onChangeText={text => {
              setFormData(prev => ({
                ...prev,
                name: text
              }));

              if (errors.name) {
                setErrors(prev => ({
                  ...prev,
                  name: undefined,
                }));
              }
            }}
            placeholder="Enter name"
            placeholderTextColor={"#9e9e9e"}
            keyboardType="visible-password"
          />
          {errors.name && (
            <Text style={styles.errorText}>
              {errors.name}
            </Text>
          )}

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
            onPress={handleSignUp}
          >
            <Text style={styles.btnText}>
              Sign Up
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