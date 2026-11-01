import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
  ProgressBar,
} from '@/components/ui';
import { Colors, Fonts } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import type { WishlistItem } from '@/db/types';

const CATEGORIES = ['Tech', 'Travel', 'Home', 'Style', 'Other'] as const;
const PRIORITIES: ('low' | 'medium' | 'high')[] = ['high', 'medium', 'low'];

export default function WishlistScreen() {
  const router = useRouter();
  const { wishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem } = useLedger();

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'ready'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newSaved, setNewSaved] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Tech');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick deposit modal state
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositTargetItem, setDepositTargetItem] = useState<WishlistItem | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Statistics calculation
  const stats = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let activeCount = 0;
    let readyCount = 0;

    for (const item of wishlist) {
      totalTarget += item.target_amount;
      totalSaved += item.saved_amount;
      if (item.is_purchased || item.saved_amount >= item.target_amount) {
        readyCount += 1;
      } else {
        activeCount += 1;
      }
    }

    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const overallProgress = totalTarget > 0 ? Math.min(1, totalSaved / totalTarget) : 0;
    const overallPercent = Math.round(overallProgress * 100);

    return {
      totalTarget,
      totalSaved,
      totalRemaining,
      overallProgress,
      overallPercent,
      activeCount,
      readyCount,
      totalCount: wishlist.length,
    };
  }, [wishlist]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return wishlist.filter((item) => {
      const isReady = item.is_purchased === 1 || item.saved_amount >= item.target_amount;
      if (activeFilter === 'active') return !isReady;
      if (activeFilter === 'ready') return isReady;
      return true;
    });
  }, [wishlist, activeFilter]);

  const handleCreateItem = async () => {
    const targetNum = parseFloat(newTarget);
    if (!newTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a name for this wishlist item.');
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    const savedNum = parseFloat(newSaved) || 0;
    setIsSubmitting(true);
    try {
      await createWishlistItem({
        title: newTitle.trim(),
        target_amount: targetNum,
        saved_amount: Math.min(savedNum, targetNum),
        category: newCategory,
        priority: newPriority,
        note: newNote.trim() || null,
        is_purchased: savedNum >= targetNum ? 1 : 0,
      });

      // Reset form
      setNewTitle('');
      setNewTarget('');
      setNewSaved('');
      setNewCategory('Tech');
      setNewPriority('medium');
      setNewNote('');
      setModalVisible(false);
    } catch (err) {
      console.warn('Failed to create wishlist item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDeposit = async () => {
    if (!depositTargetItem) return;
    const addAmt = parseFloat(depositAmount);
    if (isNaN(addAmt) || addAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to save.');
      return;
    }

    const newSaved = Math.min(
      depositTargetItem.target_amount,
      depositTargetItem.saved_amount + addAmt
    );

    try {
      await updateWishlistItem(depositTargetItem.id, {
        saved_amount: newSaved,
        is_purchased: newSaved >= depositTargetItem.target_amount ? 1 : depositTargetItem.is_purchased,
      });
      setDepositModalVisible(false);
      setDepositAmount('');
      setDepositTargetItem(null);
    } catch (err) {
      console.warn('Failed to update wishlist item:', err);
    }
  };

  const togglePurchased = async (item: WishlistItem) => {
    const updatedStatus = item.is_purchased === 1 ? 0 : 1;
    await updateWishlistItem(item.id, { is_purchased: updatedStatus });
  };

  const handleDelete = (item: WishlistItem) => {
    Alert.alert(
      'Remove Wishlist Item',
      `Are you sure you want to remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteWishlistItem(item.id),
        },
      ]
    );
  };

  const getPriorityColor = (p: 'low' | 'medium' | 'high') => {
    if (p === 'high') return Colors.hankoRed;
    if (p === 'medium') return Colors.categoryFood;
    return Colors.categoryBills;
  };

  return (
    <Main>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <AppText variant="serifTitle">Wishlist</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            欲しいもの · Target acquisitions
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        >
          <AppText variant="bodyBold" color={Colors.textInverse}>
            + Add item
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Summary Bento Cards Row */}
      <View style={styles.statsRow}>
        {/* Total Target Card */}
        <BentoCard variant="dark" style={styles.targetCard}>
          <View style={styles.cardHeaderSmall}>
            <AppText variant="caption" color={Colors.textMuted}>
              目標 · TARGET
            </AppText>
            <HankoStamp size="sm" />
          </View>
          <View style={styles.lcdRow}>
            <AppText variant="digital" color={Colors.textInverse} style={styles.lcdSmall}>
              {stats.totalTarget.toLocaleString()}
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.etbLabel}>
              ETB
            </AppText>
          </View>
          <AppText variant="caption" color={Colors.textMuted}>
            Saved: {stats.totalSaved.toLocaleString()} ETB
          </AppText>
        </BentoCard>

        {/* Progress Card */}
        <BentoCard variant="light" style={styles.progressCard}>
          <AppText variant="caption" color={Colors.textSecondary}>
            進捗 · PROGRESS
          </AppText>
          <View style={styles.progressNumberRow}>
            <AppText variant="serifTitle" style={styles.progressPercentText}>
              {stats.overallPercent}%
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              completed
            </AppText>
          </View>
          <ProgressBar progress={stats.overallProgress} fillColor={Colors.bambooGreen} height={7} />
          <AppText variant="caption" color={Colors.textSecondary} style={styles.leftSummaryText}>
            {stats.totalRemaining.toLocaleString()} ETB left to save
          </AppText>
        </BentoCard>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <PillBadge
          variant={activeFilter === 'all' ? 'dark' : 'outline'}
          label={`All (${stats.totalCount})`}
          onPress={() => setActiveFilter('all')}
        />
        <PillBadge
          variant={activeFilter === 'active' ? 'dark' : 'outline'}
          label={`In Progress (${stats.activeCount})`}
          onPress={() => setActiveFilter('active')}
        />
        <PillBadge
          variant={activeFilter === 'ready' ? 'income' : 'outline'}
          label={`Ready / Done (${stats.readyCount})`}
          onPress={() => setActiveFilter('ready')}
        />
      </View>

      {/* Items List */}
      <View style={styles.itemsList}>
        {filteredItems.map((item) => {
          const progress = Math.min(1, item.target_amount > 0 ? item.saved_amount / item.target_amount : 0);
          const percentSaved = Math.round(progress * 100);
          const percentLeft = Math.max(0, 100 - percentSaved);
          const amountLeft = Math.max(0, item.target_amount - item.saved_amount);
          const isReady = item.is_purchased === 1 || item.saved_amount >= item.target_amount;

          return (
            <BentoCard key={item.id} variant="light" style={styles.itemCard}>
              {/* Item Header */}
              <View style={styles.itemHeader}>
                <View style={styles.titleArea}>
                  <AppText variant="bodyBold" style={styles.itemTitle}>
                    {item.title}
                  </AppText>
                  {item.note ? (
                    <AppText variant="caption" color={Colors.textSecondary}>
                      {item.note}
                    </AppText>
                  ) : null}
                </View>

                <View style={styles.badgesRow}>
                  <PillBadge
                    variant="outline"
                    label={item.category}
                    style={styles.categoryPill}
                  />
                  <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) }]}>
                    <AppText
                      variant="caption"
                      style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}
                    >
                      {item.priority}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Progress & Financial Info */}
              <View style={styles.itemFinancials}>
                <View style={styles.savedRow}>
                  <View>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      Saved
                    </AppText>
                    <AppText variant="bodyBold" color={Colors.bambooGreen}>
                      {item.saved_amount.toLocaleString()} ETB
                    </AppText>
                  </View>

                  <View style={styles.alignRight}>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      Target
                    </AppText>
                    <AppText variant="bodyBold">
                      {item.target_amount.toLocaleString()} ETB
                    </AppText>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarWrap}>
                  <ProgressBar
                    progress={progress}
                    fillColor={isReady ? Colors.bambooGreen : Colors.categoryTransport}
                    height={8}
                  />
                </View>

                {/* Percent & Amount Remaining Notice */}
                <View style={styles.leftRow}>
                  <View style={styles.percentBadgeGroup}>
                    <PillBadge
                      variant={isReady ? 'income' : 'expense'}
                      label={isReady ? '✓ 100% saved' : `${percentSaved}% saved`}
                    />
                    {!isReady && (
                      <AppText variant="caption" color={Colors.textSecondary}>
                        ({percentLeft}% left)
                      </AppText>
                    )}
                  </View>

                  <AppText
                    variant="bodyBold"
                    color={isReady ? Colors.bambooGreen : Colors.hankoRed}
                  >
                    {isReady ? 'Ready to buy!' : `${amountLeft.toLocaleString()} ETB left`}
                  </AppText>
                </View>
              </View>

              {/* Action Buttons Footer */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => togglePurchased(item)}
                  style={[
                    styles.actionBtn,
                    item.is_purchased === 1 ? styles.actionBtnActive : styles.actionBtnOutline,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={item.is_purchased === 1 ? Colors.textInverse : Colors.textPrimary}
                  >
                    {item.is_purchased === 1 ? '✓ Purchased' : 'Mark bought'}
                  </AppText>
                </TouchableOpacity>

                <View style={styles.actionRightGroup}>
                  {!isReady && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setDepositTargetItem(item);
                        setDepositModalVisible(true);
                      }}
                      style={styles.depositBtn}
                    >
                      <AppText variant="caption" color={Colors.textInverse}>
                        + Deposit saving
                      </AppText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDelete(item)}
                    style={styles.deleteBtn}
                  >
                    <AppText variant="caption" color={Colors.textSecondary}>
                      ✕
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </BentoCard>
          );
        })}

        {filteredItems.length === 0 && (
          <BentoCard variant="light" style={styles.emptyCard}>
            <HankoStamp size="md" />
            <AppText variant="bodyBold" style={styles.emptyTitle}>
              No wishlist items found
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} style={styles.emptySubtitle}>
              Tap the "+ Add item" button above to set your first saving goal!
            </AppText>
          </BentoCard>
        )}
      </View>

      {/* Modal: Create Wishlist Item */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="serifTitle">New Wishlist Goal</AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  新しい目標 · Add thing to buy
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppText variant="body" color={Colors.textSecondary}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <View style={styles.formGroup}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Item name / What to buy
              </AppText>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Sony WH-1000XM5, Trip to Kyoto"
                placeholderTextColor={Colors.textMuted}
                style={styles.formInput}
              />
            </View>

            {/* Target & Saved Row */}
            <View style={styles.splitRow}>
              <View style={[styles.formGroup, styles.flex1]}>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Target cost (ETB)
                </AppText>
                <TextInput
                  value={newTarget}
                  onChangeText={setNewTarget}
                  keyboardType="numeric"
                  placeholder="e.g. 18000"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.formInput}
                />
              </View>

              <View style={[styles.formGroup, styles.flex1]}>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Already saved (ETB)
                </AppText>
                <TextInput
                  value={newSaved}
                  onChangeText={setNewSaved}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.formInput}
                />
              </View>
            </View>

            {/* Category selection */}
            <View style={styles.formGroup}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Category
              </AppText>
              <View style={styles.pillsRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = newCategory === cat;
                  return (
                    <PillBadge
                      key={cat}
                      variant={isSelected ? 'dark' : 'outline'}
                      label={cat}
                      onPress={() => setNewCategory(cat)}
                    />
                  );
                })}
              </View>
            </View>

            {/* Priority selection */}
            <View style={styles.formGroup}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Priority
              </AppText>
              <View style={styles.pillsRow}>
                {PRIORITIES.map((pri) => {
                  const isSelected = newPriority === pri;
                  return (
                    <PillBadge
                      key={pri}
                      variant={isSelected ? 'dark' : 'outline'}
                      label={pri.toUpperCase()}
                      onPress={() => setNewPriority(pri)}
                    />
                  );
                })}
              </View>
            </View>

            {/* Note input */}
            <View style={styles.formGroup}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Note / Description (Optional)
              </AppText>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Why do you want this item?"
                placeholderTextColor={Colors.textMuted}
                style={styles.formInput}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateItem}
              disabled={isSubmitting}
              style={styles.submitModalBtn}
            >
              <AppText variant="bodyBold" color={Colors.textInverse}>
                {isSubmitting ? 'Adding...' : 'Create wishlist goal'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Quick Deposit towards Wishlist Item */}
      <Modal
        visible={depositModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.depositModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="bodyBold">Deposit to Goal</AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {depositTargetItem?.title}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setDepositModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppText variant="body" color={Colors.textSecondary}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.depositTargetInfo}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Current Saved: {depositTargetItem?.saved_amount.toLocaleString()} ETB /{' '}
                {depositTargetItem?.target_amount.toLocaleString()} ETB
              </AppText>
            </View>

            <View style={styles.formGroup}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Amount to add (ETB)
              </AppText>
              <TextInput
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="numeric"
                autoFocus={true}
                placeholder="e.g. 1000"
                placeholderTextColor={Colors.textMuted}
                style={[styles.formInput, styles.depositBigInput]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleQuickDeposit}
              style={styles.depositSubmitBtn}
            >
              <AppText variant="bodyBold" color={Colors.textInverse}>
                Save deposit
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Main>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addBtn: {
    backgroundColor: Colors.cardDark,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  targetCard: {
    flex: 1.1,
    paddingVertical: 14,
    gap: 6,
  },
  progressCard: {
    flex: 1.1,
    paddingVertical: 14,
    gap: 6,
    justifyContent: 'space-between',
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lcdRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  lcdSmall: {
    fontSize: 24,
  },
  etbLabel: {
    fontSize: 11,
    marginLeft: 4,
  },
  progressNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  progressPercentText: {
    fontSize: 22,
  },
  leftSummaryText: {
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  itemsList: {
    gap: 14,
    paddingBottom: 20,
  },
  itemCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleArea: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: Fonts.sansBold,
    textTransform: 'uppercase',
  },
  itemFinancials: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 8,
  },
  savedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  progressBarWrap: {
    marginVertical: 2,
  },
  leftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  actionBtnOutline: {
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  actionBtnActive: {
    borderColor: Colors.cardDark,
    backgroundColor: Colors.cardDark,
  },
  actionRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  depositBtn: {
    backgroundColor: Colors.bambooGreen,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    marginTop: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 42, 40, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  depositModalContent: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    gap: 6,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: Colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  depositBigInput: {
    fontSize: 22,
    fontFamily: Fonts.digital,
  },
  depositTargetInfo: {
    backgroundColor: Colors.cardElevated,
    padding: 10,
    borderRadius: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  submitModalBtn: {
    backgroundColor: Colors.cardDark,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  depositSubmitBtn: {
    backgroundColor: Colors.bambooGreen,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
