import AsyncStorage from '@react-native-async-storage/async-storage';

const PALETTE = [
  '#fe6d00', '#f54242', '#f5a142', '#f5d142', 
  '#42f54b', '#42f5d1', '#42a1f5', '#4242f5', 
  '#a142f5', '#d142f5', '#f542a1'
];

const colorCache = new Map<number, string>();
const STORAGE_KEY = '@user-colors';

// Load cached colors from AsyncStorage
async function loadColorsFromStorage() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const [id, color] of Object.entries(parsed)) {
        colorCache.set(Number(id), color as string);
      }
    }
  } catch (e) {
    console.error('Failed to load user colors', e);
  }
}

loadColorsFromStorage();

// Function to get a color for a user ID
export async function getUserColor(userId: number): Promise<string> {
  if (colorCache.has(userId)) {
    return colorCache.get(userId)!;
  }
  
  const color = PALETTE[userId % PALETTE.length];
  colorCache.set(userId, color);

  try {
    const allColors = Object.fromEntries(colorCache);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allColors));
  } catch (e) {
    console.error('Failed to save user color', e);
  }

  return color;
} 