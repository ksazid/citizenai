import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const LEARNER_STORAGE_KEY = 'citizenai.runtime.learnerId.v1';
const ACCESS_TOKEN_PREFIX = 'citizenai.runtime.guestAccess.v1.';

const learnerTokenKey = (learnerId: string) => `${ACCESS_TOKEN_PREFIX}${learnerId}`;

export async function readStoredLearnerId() {
  return AsyncStorage.getItem(LEARNER_STORAGE_KEY);
}

export async function writeStoredLearnerId(learnerId: string) {
  await AsyncStorage.setItem(LEARNER_STORAGE_KEY, learnerId);
}

export async function clearStoredLearnerId() {
  await AsyncStorage.removeItem(LEARNER_STORAGE_KEY);
}

export async function readGuestAccessToken(learnerId: string) {
  const key = learnerTokenKey(learnerId);
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);

  const secureValue = await SecureStore.getItemAsync(key);
  if (secureValue) return secureValue;

  const legacyValue = await AsyncStorage.getItem(key);
  if (!legacyValue) return null;
  await SecureStore.setItemAsync(key, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

export async function writeGuestAccessToken(learnerId: string, token: string) {
  const key = learnerTokenKey(learnerId);
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, token);
    return;
  }
  await SecureStore.setItemAsync(key, token);
  await AsyncStorage.removeItem(key);
}

export async function deleteGuestAccessToken(learnerId: string) {
  const key = learnerTokenKey(learnerId);
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(key);
  await AsyncStorage.removeItem(key);
}
