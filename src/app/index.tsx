import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignIn } from '../components/SignIn';
import { shortDate } from '../lib/format';
import type { MessageSummary } from '../lib/gmail';
import { useStore } from '../lib/store';
import { fonts, Theme, useTheme } from '../lib/theme';

export default function Inbox() {
  const store = useStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const s = styles(theme);

  const open = useCallback((id: string) => router.push({ pathname: '/message/[id]', params: { id } }), []);
  const renderItem = useCallback(
    ({ item }: { item: MessageSummary }) => <Row message={item} theme={theme} onPress={open} />,
    [theme, open]
  );

  useEffect(() => {
    if (!store.lastArchived) return;
    const t = setTimeout(store.dismissUndo, 4500);
    return () => clearTimeout(t);
  }, [store.lastArchived, store.dismissUndo]);

  if (!store.account) return <SignIn />;

  const confirmSignOut = () =>
    Alert.alert(store.account!.email, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: store.signOut },
    ]);

  const initial = (store.account.name ?? store.account.email).slice(0, 1).toUpperCase();
  const count = store.messages.length;

  const header = (
    <View style={[s.header, { paddingTop: insets.top + 28 }]}>
      <View style={s.headerRow}>
        <Text style={s.title}>Inbox</Text>
        <Pressable onPress={confirmSignOut} hitSlop={12} style={s.avatar}>
          {store.account.photo ? (
            <Image source={{ uri: store.account.photo }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{initial}</Text>
          )}
        </Pressable>
      </View>
      <Text style={s.subtitle}>
        {store.status === 'loading'
          ? 'Fetching your mail…'
          : count === 0
            ? 'All caught up'
            : `${count}${store.hasMore ? '+' : ''} to read`}
      </Text>
      {store.error ? (
        <Pressable onPress={store.refresh} style={s.error}>
          <Text style={s.errorText}>{store.error} · Tap to retry</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={s.screen}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <FlatList
        data={store.messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={s.separator} />}
        ListEmptyComponent={
          store.status === 'loading' ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 48 }} />
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Nothing left to read.</Text>
              <Text style={s.emptyBody}>New newsletters will appear here.</Text>
            </View>
          )
        }
        ListFooterComponent={
          store.status === 'loadingMore' ? (
            <ActivityIndicator color={theme.faint} style={{ marginVertical: 24 }} />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        onEndReached={store.loadMore}
        onEndReachedThreshold={1.5}
        refreshControl={
          <RefreshControl
            refreshing={store.status === 'refreshing'}
            onRefresh={store.refresh}
            colors={[theme.accent]}
            tintColor={theme.accent}
            progressBackgroundColor={theme.surface}
            progressViewOffset={insets.top}
          />
        }
      />
      {store.lastArchived ? (
        <View style={[s.toastWrap, { bottom: insets.bottom + 20 }]} pointerEvents="box-none">
          <View style={s.toast}>
            <Text style={s.toastText} numberOfLines={1}>
              Archived
            </Text>
            <Pressable onPress={store.undoArchive} hitSlop={12}>
              <Text style={s.toastAction}>Undo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const Row = memo(function Row({
  message,
  theme,
  onPress,
}: {
  message: MessageSummary;
  theme: Theme;
  onPress: (id: string) => void;
}) {
  const s = styles(theme);
  return (
    <Pressable
      onPress={() => onPress(message.id)}
      android_ripple={{ color: theme.hairline }}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: theme.surface }]}
    >
      <View style={s.rowTop}>
        <Text style={s.sender} numberOfLines={1}>
          {message.from}
        </Text>
        <Text style={s.date}>{shortDate(message.date)}</Text>
      </View>
      <Text style={s.subject} numberOfLines={2}>
        {message.subject}
      </Text>
      {message.snippet ? (
        <Text style={s.snippet} numberOfLines={2}>
          {message.snippet}
        </Text>
      ) : null}
    </Pressable>
  );
});

const cache = new Map<Theme, ReturnType<typeof create>>();
function styles(t: Theme) {
  let s = cache.get(t);
  if (!s) cache.set(t, (s = create(t)));
  return s;
}

function create(t: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    header: { paddingHorizontal: 22, paddingBottom: 18 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: fonts.serifBold, fontSize: 40, color: t.text, letterSpacing: -0.6 },
    subtitle: { fontFamily: fonts.sans, fontSize: 14, color: t.muted, marginTop: 2 },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: t.surface,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: 34, height: 34 },
    avatarText: { fontFamily: fonts.sansBold, fontSize: 14, color: t.muted },
    error: { marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: t.surface },
    errorText: { fontFamily: fonts.sans, fontSize: 13, color: t.accent },
    row: { paddingHorizontal: 22, paddingVertical: 16 },
    rowTop: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 5 },
    sender: {
      flex: 1,
      fontFamily: fonts.sansBold,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: t.accent,
      marginRight: 12,
    },
    date: { fontFamily: fonts.sans, fontSize: 12, color: t.faint },
    subject: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 25, color: t.text, letterSpacing: -0.2 },
    snippet: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: t.muted, marginTop: 5 },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: t.hairline, marginHorizontal: 22 },
    empty: { alignItems: 'center', marginTop: 96, paddingHorizontal: 40 },
    emptyTitle: { fontFamily: fonts.serif, fontSize: 22, color: t.text },
    emptyBody: { fontFamily: fonts.sans, fontSize: 14, color: t.muted, marginTop: 6 },
    toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 22,
      backgroundColor: t.text,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 999,
      elevation: 6,
    },
    toastText: { fontFamily: fonts.sansMedium, fontSize: 14, color: t.bg },
    toastAction: { fontFamily: fonts.sansBold, fontSize: 14, color: t.accent },
  });
}
