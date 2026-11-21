import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/constants/theme';
import { useAlertStore } from '@/stores/alertStore';
import { triggerHaptic } from '@/utils/haptics';

export function YohakuAlertModal() {
  const { colors } = useThemeColors();
  const { isOpen, title, message, buttons, hideAlert } = useAlertStore();

  if (!isOpen) return null;

  const isDestructive = buttons.some((b) => b.style === 'destructive');

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.contentWrap}>
            <AppText
              variant="serifTitle"
              style={[
                styles.modalTitle,
                isDestructive && { color: colors.hankoRed },
              ]}
            >
              {title}
            </AppText>
            {Boolean(message) && (
              <AppText variant="caption" color={colors.textSecondary} style={styles.modalMessage}>
                {message}
              </AppText>
            )}
          </View>

          <View style={styles.buttonStack}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestr = btn.style === 'destructive';

              let bg = colors.textPrimary;
              let textColor = colors.background;
              let borderCol = 'transparent';

              if (isDestr) {
                bg = colors.hankoRed;
                textColor = '#FFFFFF';
              } else if (isCancel) {
                bg = colors.cardElevated;
                textColor = colors.textPrimary;
                borderCol = colors.border;
              }

              return (
                <TouchableOpacity
                  key={`${btn.text}-${index}`}
                  activeOpacity={0.8}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: bg,
                      borderColor: borderCol,
                      borderWidth: isCancel ? 1 : 0,
                    },
                  ]}
                  onPress={() => {
                    if (isDestr) {
                      triggerHaptic.heavy();
                    } else {
                      triggerHaptic.selection();
                    }
                    hideAlert();
                    btn.onPress?.();
                  }}
                >
                  <AppText variant="bodyBold" style={{ color: textColor }}>
                    {btn.text}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 22, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentWrap: {
    gap: 6,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalMessage: {
    lineHeight: 18,
  },
  buttonStack: {
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
