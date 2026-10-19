import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small key-value store: the device keychain on phones, localStorage in the web preview
 * (SecureStore has no web version). Failures read as "nothing saved".
 */
const web = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  try {
    return web ? globalThis.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string) {
  try {
    if (web) globalThis.localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {}
}

export async function deleteItem(key: string) {
  try {
    if (web) globalThis.localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {}
}
