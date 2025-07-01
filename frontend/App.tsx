import React from 'react';
import {StatusBar, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { authService } from './src/services/api';
import { Provider } from 'react-redux';
import { store } from './src/core/global';

import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import Home from './src/screens/Home';
import Chat from './src/screens/Chat';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Chat: {ticketId: number; isActive: boolean};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
    primary: '#007AFF',
    card: '#ffffff',
    text: '#212529',
    border: '#e9ecef',
  },
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error) {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Something went wrong. Please try again.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
  },
});

function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | undefined>(undefined);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      setInitialRoute(token ? 'Home' : 'SignIn');
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  if (checkingAuth || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <NavigationContainer theme={LightTheme}>
            <StatusBar barStyle="dark-content" />
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#fe6d00',
                },
                headerTintColor: '#ffffff',
              }}
              initialRouteName={initialRoute}>
              <Stack.Screen
                name="SignIn"
                component={SignIn}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUp}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Home"
                component={Home}
                options={({navigation}) => ({
                  title: 'Support Tickets',
                  headerRight: () => (
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={async () => {
                        await authService.signOut();
                        await AsyncStorage.removeItem('user_id');
                        await AsyncStorage.removeItem('tickets');
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'SignIn' }],
                        });
                      }}>
                      <Icon name="logout" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  ),
                })}
              />
              <Stack.Screen
                name="Chat"
                component={Chat}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ErrorBoundary>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
