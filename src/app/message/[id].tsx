import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { longDate } from '../../lib/format';
import { FullMessage, getMessage } from '../../lib/gmail';
import { useStore } from '../../lib/store';
import { fonts, useTheme } from '../../lib/theme';
import { buildReaderHtml, ReaderMessage } from '../../reader/template';

export default function Reader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const summary = store.find(id);
  const [message, setMessage] = useState<FullMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let cancelled = false;
    getMessage(id)
      .then((m) => !cancelled && setMessage(m))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  // The status bar is hidden, so only keep a little breathing room at the top.
  const html = useMemo(
    () =>
      message &&
      buildReaderHtml(
        {
          subject: message.subject,
          from: message.from,
          fromEmail: message.fromEmail,
          date: longDate(message.date),
          body: message.body,
        },
        theme,
        { top: Math.min(insets.top, 12), bottom: insets.bottom }
      ),
    // Insets are read once; rebuilding the page would reset the scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message, theme]
  );

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: ReaderMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'ready') {
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else if (msg.type === 'archive') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      store.archive(id);
      router.back();
    }
  };

  const openExternally = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <StatusBar hidden animated />
      {html ? (
        <Animated.View style={[styles.fill, { opacity }]}>
          <WebView
            source={{ html, baseUrl: '' }}
            originWhitelist={['*']}
            onMessage={onMessage}
            style={[styles.fill, { backgroundColor: theme.bg }]}
            containerStyle={{ backgroundColor: theme.bg }}
            mixedContentMode="always"
            showsVerticalScrollIndicator={false}
            setSupportMultipleWindows={false}
            allowsLinkPreview={false}
            textZoom={100}
            onShouldStartLoadWithRequest={(req) => {
              if (req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
              // Same-page anchors (footnotes, "jump to" links) stay in the reader.
              if (req.url.includes('#') && !/^https?:/i.test(req.url)) return true;
              openExternally(req.url);
              return false;
            }}
            onOpenWindow={(e) => openExternally(e.nativeEvent.targetUrl)}
          />
        </Animated.View>
      ) : (
        <View style={[styles.loading, { paddingTop: insets.top + 36 }]}>
          {summary ? (
            <>
              <Text style={[styles.sender, { color: theme.accent }]}>{summary.from}</Text>
              <Text style={[styles.subject, { color: theme.text }]}>{summary.subject}</Text>
            </>
          ) : null}
          {error ? (
            <Pressable
              onPress={() => {
                setError(null);
                setAttempt((n) => n + 1);
              }}
              style={styles.errorBox}
            >
              <Text style={[styles.errorText, { color: theme.muted }]}>
                {error}
                {'\n'}
                <Text style={{ color: theme.accent }}>Tap to retry</Text>
              </Text>
            </Pressable>
          ) : (
            <ActivityIndicator color={theme.faint} style={{ marginTop: 40 }} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fill: { flex: 1 },
  loading: { flex: 1, paddingHorizontal: 22 },
  sender: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  subject: { fontFamily: fonts.serifBold, fontSize: 31, lineHeight: 36, letterSpacing: -0.4 },
  errorBox: { marginTop: 40 },
  errorText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
});
