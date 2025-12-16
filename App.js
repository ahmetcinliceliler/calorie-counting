import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import TabNavigator from './src/navigation/TabNavigator';

import OnboardingScreen from './src/screens/OnboardingScreen';
import { registerForPushNotificationsAsync, scheduleDailyReminders } from './src/utils/NotificationManager';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkProfile();
    initNotifications();
  }, []);

  const initNotifications = async () => {
    await registerForPushNotificationsAsync();
    await scheduleDailyReminders();
  };

  const checkProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem('@user_profile');
      setHasProfile(!!profile);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        {hasProfile ? (
          <TabNavigator />
        ) : (
          <OnboardingScreen onFinish={() => setHasProfile(true)} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}