import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
  JapaneseIcon,
  UserAvatar,
  PRESET_AVATARS,
  getPresetAvatar,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { triggerHaptic } from '@/utils/haptics';
import { getAuthErrorMessage, sendPasswordReset } from '@/services/firebaseAuth';

type EditModalType = 'none' | 'name' | 'email' | 'password';

export default function AccountSettings() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const accounts = useAuthStore((s) => s.accounts);
  const lockSession = useAuthStore((s) => s.lockSession);
  const removeAccount = useAuthStore((s) => s.removeAccount);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const updateProfileName = useAuthStore((s) => s.updateProfileName);
  const updateProfileEmail = useAuthStore((s) => s.updateProfileEmail);
  const updateAccountPassword = useAuthStore((s) => s.updateAccountPassword);
  const updateProfileAvatar = useAuthStore((s) => s.updateProfileAvatar);
  const { isDeviceOnline } = useSyncStore();

  // Text Form Modals
  const [modalType, setModalType] = useState<EditModalType>('none');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const openModal = (type: EditModalType) => {
    triggerHaptic.selection();
    setModalType(type);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords(false);
    if (type === 'name') {
      setNewName(activeAccount?.name || '');
    } else if (type === 'email') {
      setNewEmail(activeAccount?.email || '');
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalType('none');
  };

  const openAvatarModal = () => {
    triggerHaptic.selection();
    setSelectedAvatar(activeAccount?.avatarUrl ?? null);
    setShowAvatarModal(true);
  };

  const closeAvatarModal = () => {
    if (isSubmitting) return;
    setShowAvatarModal(false);
  };

  const handlePickCustomImage = async () => {
    triggerHaptic.selection();
    setIsPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatar(result.assets[0].uri);
        triggerHaptic.success();
      }
    } catch (err: any) {
      Alert.alert('Photo Picker Error', err?.message || 'Could not pick an image.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!activeAccount) return;
    setIsSubmitting(true);
    try {
      await updateProfileAvatar(activeAccount.id, selectedAvatar);
      triggerHaptic.success();
      setShowAvatarModal(false);
      Alert.alert('Success', 'Profile picture updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update profile picture.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveName = async () => {
    if (!activeAccount) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a valid username.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileName(activeAccount.id, trimmed);
      triggerHaptic.success();
      Alert.alert('Success', 'Username has been updated.');
      closeModal();
    } catch (err: any) {
      Alert.alert('Update Failed', getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!activeAccount) return;
    const trimmed = newEmail.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a new email address.');
      return;
    }
    if (!currentPassword) {
      Alert.alert('Required', 'Please enter your current password to authorize this email update.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateProfileEmail(activeAccount.id, currentPassword, trimmed);
      triggerHaptic.success();
      if (res.emailUpdatedImmediately) {
        Alert.alert('Success', 'Email address has been updated successfully.');
      } else {
        Alert.alert(
          'Verification Required',
          `A verification link has been sent to ${trimmed}. Please confirm the email to complete the update.`
        );
      }
      closeModal();
    } catch (err: any) {
      Alert.alert('Update Failed', getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePassword = async () => {
    if (!activeAccount) return;
    if (!currentPassword) {
      Alert.alert('Required', 'Please enter your current password or PIN.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      Alert.alert('Password Length', 'New password/PIN must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAccountPassword(activeAccount.id, currentPassword, newPassword);
      triggerHaptic.success();
      Alert.alert('Success', 'Password/PIN has been updated.');
      closeModal();
    } catch (err: any) {
      Alert.alert('Update Failed', getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotInModal = () => {
    if (!activeAccount?.email) return;
    triggerHaptic.selection();

    Alert.alert(
      'Reset Password',
      `Dispatch a password reset link to ${activeAccount.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await sendPasswordReset(activeAccount.email);
              triggerHaptic.success();
              closeModal();
              Alert.alert(
                'Reset Email Dispatched',
                `A password reset link has been dispatched to ${activeAccount.email}. Please follow the link in your email to set a new password.`
              );
            } catch (err: any) {
              Alert.alert('Reset Failed', getAuthErrorMessage(err));
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    if (!activeAccount) return;
    Alert.alert(
      'Sign Out',
      activeAccount.isLocal
        ? `Close session for "${activeAccount.name}"? Your local ledger will remain saved on this device.`
        : `Sign out of ${activeAccount.name}? Your local ledger will be preserved on this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await removeAccount(activeAccount.id);
            if (accounts.length <= 1) {
              router.replace('/(auth)/onboarding');
            } else {
              router.replace('/(auth)/select-account');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!activeAccount) return;
    const isLocal = activeAccount.isLocal;
    Alert.alert(
      'Delete Account & Data',
      isLocal
        ? `Permanently delete profile "${activeAccount.name}"? All transactions and saved data on this device will be erased. This action cannot be undone.`
        : `Permanently delete account "${activeAccount.name}"? All transactions and cloud backups will be erased. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHaptic.heavy();
              await deleteAccount(activeAccount.id);
              if (accounts.length <= 1) {
                router.replace('/(auth)/onboarding');
              } else {
                router.replace('/(auth)/select-account');
              }
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete account.');
            }
          },
        },
      ]
    );
  };

  const currentPreset = getPresetAvatar(activeAccount?.avatarUrl);

  return (
    <Main contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic.selection();
            router.replace('/(tabs)/settings' as Href);
          }}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <JapaneseIcon name="chevronLeft" size={16} color={colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText variant="serifTitle" style={styles.headerTitle}>Account</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.headerSubtitle}>
            口座 · Profiles & Settings
          </AppText>
        </View>
      </View>

      {/* Active Profile Card */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>ACTIVE PROFILE</AppText>
        <View style={styles.profileRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openAvatarModal}
            style={styles.avatarTouchable}
          >
            <UserAvatar
              avatarUrl={activeAccount?.avatarUrl}
              name={activeAccount?.name}
              size={52}
            />
            <View style={[styles.avatarBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <JapaneseIcon name="sensu" size={11} color={colors.textPrimary} strokeWidth={2} />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">{activeAccount?.name || 'Local Ledger'}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {activeAccount?.isLocal
                ? 'Device only · Offline'
                : activeAccount?.email || 'No email linked'}
            </AppText>
          </View>
          {activeAccount?.isLocal ? (
            <PillBadge variant="outline" label="Local" />
          ) : (
            <PillBadge
              variant={isDeviceOnline ? 'income' : 'expense'}
              label={isDeviceOnline ? '● Online' : '○ Offline'}
            />
          )}
        </View>
      </BentoCard>

      {/* Profile Details (Edit Avatar, Username, Email, Password) */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>PROFILE DETAILS</AppText>

        {/* Profile Picture / Avatar Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openAvatarModal}
          style={[styles.profileDetailRow, { borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.textMuted} style={styles.detailLabel}>
              PROFILE PICTURE / AVATAR
            </AppText>
            <AppText variant="bodyBold" numberOfLines={1}>
              {currentPreset?.name || (activeAccount?.avatarUrl ? 'Custom Image' : 'Monogram Letter')}
            </AppText>
          </View>
          <View style={[styles.editPill, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
            <AppText variant="caption" color={colors.textPrimary} style={styles.editPillText}>
              Change
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Username Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openModal('name')}
          style={[styles.profileDetailRow, { borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.textMuted} style={styles.detailLabel}>
              USERNAME
            </AppText>
            <AppText variant="bodyBold" numberOfLines={1}>
              {activeAccount?.name || 'Not set'}
            </AppText>
          </View>
          <View style={[styles.editPill, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
            <AppText variant="caption" color={colors.textPrimary} style={styles.editPillText}>
              Edit
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Email Row (Cloud Accounts Only) */}
        {!activeAccount?.isLocal && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openModal('email')}
            style={[styles.profileDetailRow, { borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.textMuted} style={styles.detailLabel}>
                EMAIL ADDRESS
              </AppText>
              <AppText variant="bodyBold" numberOfLines={1}>
                {activeAccount?.email || 'Not set'}
              </AppText>
            </View>
            <View style={[styles.editPill, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
              <AppText variant="caption" color={colors.textPrimary} style={styles.editPillText}>
                Update
              </AppText>
            </View>
          </TouchableOpacity>
        )}

        {/* Password / Passcode Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => openModal('password')}
          style={[styles.profileDetailRow, { borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.textMuted} style={styles.detailLabel}>
              {activeAccount?.isLocal ? 'DEVICE PASSCODE / PIN' : 'ACCOUNT PASSWORD'}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              ••••••••
            </AppText>
          </View>
          <View style={[styles.editPill, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
            <AppText variant="caption" color={colors.textPrimary} style={styles.editPillText}>
              Change
            </AppText>
          </View>
        </TouchableOpacity>
      </BentoCard>

      {/* Account actions */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>SESSION</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic.selection();
            lockSession();
            router.push('/(auth)/select-account');
          }}
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="exchange" size={20} color={colors.textPrimary} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" style={{ fontSize: 14 }}>
              Switch Account
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {accounts.length} profile{accounts.length !== 1 ? 's' : ''} on this device
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
        </TouchableOpacity>
      </BentoCard>

      {/* Danger zone */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.hankoRed}>DANGER ZONE</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="exit" size={20} color={colors.textPrimary} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" style={{ fontSize: 14 }}>Sign Out</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Close this profile session
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
          style={[styles.actionBtn, { borderColor: colors.hankoRed, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="sweep" size={20} color={colors.hankoRed} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" color={colors.hankoRed} style={{ fontSize: 14 }}>
              Delete Account & All Data
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Permanent — cannot be undone
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.hankoRed }]}>›</AppText>
        </TouchableOpacity>
      </BentoCard>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={closeAvatarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="serifTitle" style={styles.modalTitle}>
                  Profile Picture
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Choose a Japanese Kamon illustration or your own photo.
                </AppText>
              </View>
              <TouchableOpacity
                onPress={closeAvatarModal}
                disabled={isSubmitting}
                style={[styles.closeBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={{ fontSize: 16, color: colors.textPrimary }}>✕</AppText>
              </TouchableOpacity>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* Preview Circle */}
              <View style={styles.avatarPreviewWrap}>
                <UserAvatar
                  avatarUrl={selectedAvatar}
                  name={activeAccount?.name}
                  size={76}
                />
                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
                  Preview
                </AppText>
              </View>

              {/* Option 1: Custom Image from Device */}
              <View style={styles.avatarSection}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.avatarSectionLabel}>
                  DEVICE PHOTO
                </AppText>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isPickingImage || isSubmitting}
                  onPress={handlePickCustomImage}
                  style={[
                    styles.customPhotoBtn,
                    { borderColor: colors.border, backgroundColor: colors.cardElevated },
                  ]}
                >
                  <JapaneseIcon name="search" size={18} color={colors.textPrimary} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyBold" style={{ fontSize: 13 }}>
                      {isPickingImage ? 'Selecting…' : 'Choose from Photo Library'}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      Select any image from your device
                    </AppText>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Option 2: Preset Japanese Illustrations */}
              <View style={styles.avatarSection}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.avatarSectionLabel}>
                  JAPANESE ILLUSTRATIONS
                </AppText>
                <View style={styles.presetsGrid}>
                  {PRESET_AVATARS.map((p) => {
                    const isSelected = selectedAvatar === p.id;
                    const bgColor = isDark ? p.bgDark : p.bgLight;
                    const iconColor = isDark ? p.iconDark : p.iconLight;

                    return (
                      <TouchableOpacity
                        key={p.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          triggerHaptic.selection();
                          setSelectedAvatar(p.id);
                        }}
                        style={[
                          styles.presetGridItem,
                          {
                            backgroundColor: bgColor,
                            borderColor: isSelected ? colors.bambooGreen : colors.border,
                            borderWidth: isSelected ? 2.5 : 1,
                          },
                        ]}
                      >
                        <JapaneseIcon name={p.icon} size={24} color={iconColor} strokeWidth={2} />
                        <AppText
                          variant="caption"
                          style={[
                            styles.presetLabel,
                            { color: isSelected ? colors.textPrimary : colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {p.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Option 3: Reset to monogram */}
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic.selection();
                  setSelectedAvatar(null);
                }}
                style={styles.resetMonogramBtn}
              >
                <AppText variant="caption" color={colors.textMuted}>
                  Reset to Letter Monogram
                </AppText>
              </TouchableOpacity>

              {/* Action Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSubmitting}
                onPress={handleSaveAvatar}
                style={[styles.saveBtn, { backgroundColor: colors.textPrimary, marginTop: 12 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <AppText variant="bodyBold" color={colors.background}>
                    Save Profile Picture
                  </AppText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Text Form Modals (Username, Email, Password) */}
      <Modal
        visible={modalType !== 'none'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="serifTitle" style={styles.modalTitle}>
                  {modalType === 'name' && 'Edit Username'}
                  {modalType === 'email' && 'Update Email'}
                  {modalType === 'password' && (activeAccount?.isLocal ? 'Change Passcode' : 'Change Password')}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {modalType === 'name' && 'Set a new display name for your profile.'}
                  {modalType === 'email' && 'Update your cloud sync email address.'}
                  {modalType === 'password' && 'Enter your current password and choose a new one.'}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                disabled={isSubmitting}
                style={[styles.closeBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={{ fontSize: 16, color: colors.textPrimary }}>✕</AppText>
              </TouchableOpacity>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* Form: Username */}
              {modalType === 'name' && (
                <View style={styles.modalForm}>
                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                      USERNAME
                    </AppText>
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="e.g. Satoshi"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                      style={[
                        styles.input,
                        { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                    onPress={handleSaveName}
                    style={[styles.saveBtn, { backgroundColor: colors.textPrimary }]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <AppText variant="bodyBold" color={colors.background}>
                        Save Username
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Form: Email */}
              {modalType === 'email' && (
                <View style={styles.modalForm}>
                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                      NEW EMAIL ADDRESS
                    </AppText>
                    <TextInput
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="new.email@example.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      style={[
                        styles.input,
                        { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                      CURRENT ACCOUNT PASSWORD
                    </AppText>
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveEmail}
                      style={[
                        styles.input,
                        { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                    {!activeAccount?.isLocal && Boolean(activeAccount?.email) && (
                      <TouchableOpacity
                        onPress={handleForgotInModal}
                        disabled={isSubmitting}
                        style={styles.forgotLink}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <AppText variant="caption" color={colors.textSecondary}>
                          Forgot current password?{' '}
                          <AppText
                            variant="caption"
                            color={colors.textPrimary}
                            style={{ textDecorationLine: 'underline', fontFamily: Fonts.sansBold }}
                          >
                            Send reset email
                          </AppText>
                        </AppText>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                    onPress={handleSaveEmail}
                    style={[styles.saveBtn, { backgroundColor: colors.textPrimary }]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <AppText variant="bodyBold" color={colors.background}>
                        Update Email
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Form: Password / Passcode */}
              {modalType === 'password' && (
                <View style={styles.modalForm}>
                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                      CURRENT PASSWORD / PIN
                    </AppText>
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password or PIN"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPasswords}
                      autoCapitalize="none"
                      returnKeyType="next"
                      style={[
                        styles.input,
                        { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                    {!activeAccount?.isLocal && Boolean(activeAccount?.email) && (
                      <TouchableOpacity
                        onPress={handleForgotInModal}
                        disabled={isSubmitting}
                        style={styles.forgotLink}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <AppText variant="caption" color={colors.textSecondary}>
                          Forgot current password?{' '}
                          <AppText
                            variant="caption"
                            color={colors.textPrimary}
                            style={{ textDecorationLine: 'underline', fontFamily: Fonts.sansBold }}
                          >
                            Send reset email
                          </AppText>
                        </AppText>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.labelRowBetween}>
                      <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                        NEW PASSWORD / PIN
                      </AppText>
                      <TouchableOpacity onPress={() => setShowPasswords((v) => !v)}>
                        <AppText variant="caption" color={colors.textSecondary}>
                          {showPasswords ? 'Hide' : 'Show'}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Minimum 4 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPasswords}
                      autoCapitalize="none"
                      returnKeyType="next"
                      style={[
                        styles.input,
                        { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                      CONFIRM NEW PASSWORD / PIN
                    </AppText>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password or PIN"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPasswords}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSavePassword}
                      style={[
                        styles.input,
                        { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                    onPress={handleSavePassword}
                    style={[styles.saveBtn, { backgroundColor: colors.textPrimary }]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <AppText variant="bodyBold" color={colors.background}>
                        Update Password
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  card: {
    paddingVertical: 16,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailLabel: {
    letterSpacing: 1.1,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  editPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  editPillText: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  actionContent: {
    flex: 1,
    gap: 1,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  avatarSection: {
    gap: 8,
    marginTop: 10,
  },
  avatarSectionLabel: {
    letterSpacing: 1.1,
    fontSize: 9,
    fontWeight: '600',
  },
  customPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  presetLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    flex: 1,
  },
  resetMonogramBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  modalForm: {
    gap: 14,
    paddingTop: 6,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: '600',
  },
  labelRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  forgotLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 2,
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});
