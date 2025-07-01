import React, {useState} from 'react';
import {authService} from '../services/api'; // Adjust the import path as needed
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

type SignUpScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SignUp = ({navigation}: SignUpScreenProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    avatar: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSignUp = async () => {
    const { name, email, password, role } = formData;
    if (!name || !email || !role || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp({ name, email, role, password });
      setLoading(false);
      Alert.alert('Success', 'Account created successfully');
      navigation.navigate('SignIn');
    } catch (error) {
      setLoading(false);
      const err = error as { response?: { data?: { detail?: string } }, message?: string };
      const message = err.response?.data?.detail || err.message || 'Signup failed';
      Alert.alert('Error', message);
    }
  };

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign Up</Text>
          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                placeholder="Enter your name"
                style={styles.input}
                placeholderTextColor="#adb5bd"
                value={formData.name}
                onChangeText={value => handleInputChange('name', value)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Enter your email"
                style={styles.input}
                placeholderTextColor="#adb5bd"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Role</Text>
              <TextInput
                placeholder="Enter your role"
                style={styles.input}
                placeholderTextColor="#adb5bd"
                value={formData.role}
                onChangeText={value => handleInputChange('role', value)}
              />
            </View>
            {/* <View style={styles.inputContainer}>
              <Text style={styles.label}>Avatar URL</Text>
              <TextInput
                placeholder="Enter avatar URL"
                style={styles.input}
                placeholderTextColor="#adb5bd"
                value={formData.avatar}
                onChangeText={value => handleInputChange('avatar', value)}
              />
            </View> */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Create a password"
                style={styles.input}
                secureTextEntry
                placeholderTextColor="#adb5bd"
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
              />
            </View>
            <View style={styles.buttonContainer}>
              <RoundedButton
                title={loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleSignUp}
              />
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.footerLink}>Sign In</Text>
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

export default SignUp;
