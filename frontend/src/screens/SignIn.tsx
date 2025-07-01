import React, {useState} from 'react';
import { authService } from '../services/api';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RoundedButton from '../Index/Button';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '../core/global';
import { setUser } from '../core/userSlice';
import { jwtDecode } from "jwt-decode";

type SignInScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SignIn = ({navigation}: SignInScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Make the API call
      const userData = await authService.signIn(email, password);
      // Store token for API and WebSocket usage
      if (userData && userData.access_token) {
        await AsyncStorage.setItem('token', userData.access_token);
        const decodedToken: { sub: string } = jwtDecode(userData.access_token);
        const userId = parseInt(decodedToken.sub, 10);
        await AsyncStorage.setItem('user_id', userId.toString());
        dispatch(setUser({ user_id: userId, token: userData.access_token }));
      }
      setLoading(false);
      navigation.replace('Home');
    } catch (error: any) {
      setLoading(false);
      const message = error?.response?.data?.detail || error.message || 'Sign in failed';
      Alert.alert('Error', message);
    }
  };

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign In</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Enter your email"
                style={styles.input}
                placeholderTextColor="#adb5bd"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                style={styles.input}
                secureTextEntry
                placeholderTextColor="#adb5bd"
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View style={styles.buttonContainer}>
              <RoundedButton
                title={loading ? 'Signing in...' : 'Sign In'}
                onPress={handleSignIn}
              />
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonContainer: {
    marginTop: 8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#495057',
    fontSize: 16,
  },
  footerLink: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignIn;
