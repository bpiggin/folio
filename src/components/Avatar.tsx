import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { avatarUrl } from '../lib/avatar';
import { Theme, weight } from '../lib/theme';

/** A small inline sender mark: the site's favicon, or the sender's initial. */
export const Avatar = memo(function Avatar({
  name,
  email,
  size = 16,
  theme,
}: {
  name: string;
  email: string;
  size?: number;
  theme: Theme;
}) {
  const [failed, setFailed] = useState(false);
  const uri = avatarUrl(email);
  const radius = size / 2;
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius, backgroundColor: theme.surface },
      ]}
    >
      <Text style={{ fontWeight: weight.bold, fontSize: size * 0.56, color: theme.muted }}>
        {name.slice(0, 1).toUpperCase()}
      </Text>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          cachePolicy="disk"
          transition={80}
          onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
