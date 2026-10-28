import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRuellaTheme } from '@/theme/theme-context';
import { radius, space, touch } from '@/theme/tokens';
import { Icon, type IconName } from './icon';
import { RText } from './r-text';

/** Feuille d'actions qui monte du bas de l'écran. */
export function Sheet({ visible, onClose, title, subtitle, children }: { visible: boolean; onClose: () => void; title?: string; subtitle?: string; children: ReactNode }) {
  const { colors } = useRuellaTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" accessibilityRole="button" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + space.l }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        {title ? (
          <View style={{ gap: 2, marginBottom: space.s }}>
            <RText variant="place" style={{ fontSize: 22, lineHeight: 26 }}>
              {title}
            </RText>
            {subtitle ? (
              <RText variant="caption" muted>
                {subtitle}
              </RText>
            ) : null}
          </View>
        ) : null}
        {children}
      </View>
    </Modal>
  );
}

export function SheetItem({ icon, label, detail, onPress, danger }: { icon: IconName; label: string; detail?: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useRuellaTheme();
  const c = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.item, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}>
      <View style={[styles.itemIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name={icon} size={20} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <RText variant="bodyStrong" color={c}>
          {label}
        </RText>
        {detail ? (
          <RText variant="caption" muted>
            {detail}
          </RText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space.l, paddingTop: space.s, gap: 2 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: space.m },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: touch.primary, borderRadius: 14, paddingHorizontal: space.s },
  itemIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
