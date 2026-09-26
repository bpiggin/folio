import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../lib/store';
import { useTheme, weight } from '../lib/theme';

export function SignIn() {
  const { signIn, error } = useStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    setBusy(true);
    await signIn();
    setBusy(false);
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.bg, paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 },
      ]}
    >
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.hero}>
        <Text style={[styles.title, { color: theme.text }]}>Folio</Text>
        <Text style={[styles.tagline, { color: theme.muted }]}>
          A quiet place to read your newsletters.{'\n'}No toolbars, no clipping — just the words.
        </Text>
      </View>

      <View>
        {error ? <Text style={[styles.error, { color: theme.text }]}>{error}</Text> : null}
        <Pressable
          onPress={onPress}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.text, opacity: pressed || busy ? 0.8 : 1 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.bg }]}>Connect Gmail</Text>
          )}
        </Pressable>
        <Text style={[styles.fine, { color: theme.faint }]}>
          Folio reads your inbox and can archive messages. Your mail goes straight from Google to this phone.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  hero: { marginTop: 40 },
  title: { fontWeight: weight.bold, fontSize: 48, letterSpacing: -1 },
  tagline: { fontWeight: weight.regular, fontSize: 19, lineHeight: 28, marginTop: 12 },
  button: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontWeight: weight.bold, fontSize: 16, letterSpacing: 0.2 },
  error: { fontWeight: weight.regular, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  fine: { fontWeight: weight.regular, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 16 },
});
