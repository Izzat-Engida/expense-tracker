import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
  ProgressBar,
} from '@/components/ui';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useSettingsStore } from '@/stores/settingsStore';
import { localDateKey } from '@/lib/ledger';
import type { WishlistItem } from '@/db/types';

const CATEGORIES = ['Tech', 'Travel', 'Home', 'Style', 'Other'] as const;
const PRIORITIES: ('low' | 'medium' | 'high')[] = ['high', 'medium', 'low'];

export default function WishlistScreen() {
  const { colors, isDark } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const { wishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem, createSaving } =
    useLedger();

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'ready'>('all');
  const [modalVisible, setModalVisible] = useState(false);


  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newSaved, setNewSaved] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Tech');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositTargetItem, setDepositTargetItem] = useState<WishlistItem | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

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

    try {
      await createSaving({
        title: depositTargetItem.title,
        amount: addAmt,
        category: depositTargetItem.category,
        wishlist_id: depositTargetItem.id,
        note: depositTargetItem.note,
        date: localDateKey(),
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

  return (
    <Main>
      
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
          style={[styles.addBtn, { backgroundColor: isDark ? colors.cardElevated : colors.cardDark, borderColor: colors.border }]}
        >
          <AppText variant="bodyBold" color="#FFFFFF">
            + Add item
          </AppText>
        </TouchableOpacity>
      </View>

   
      <View style={styles.statsRow}>
        
        <BentoCard variant="dark" style={styles.targetCard}>
          <View style={styles.cardHeaderSmall}>
            <AppText variant="caption" color={colors.textMuted}>
              目標 · TARGET
            </AppText>
            <HankoStamp size="sm" />
          </View>
          <View style={styles.lcdRow}>
            <AppText variant="digital" color={colors.textPrimary} style={styles.lcdSmall}>
              {stats.totalTarget.toLocaleString()}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.etbLabel}>
              {currency}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            Saved: {stats.totalSaved.toLocaleString()} {currency}
          </AppText>
        </BentoCard>

      
        <BentoCard variant="light" style={styles.progressCard}>
          <AppText variant="caption" color={colors.textSecondary}>
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
          <ProgressBar progress={stats.overallProgress} fillColor={colors.bambooGreen} height={7} />
          <AppText variant="caption" color={Colors.textSecondary} style={styles.leftSummaryText}>
            {stats.totalRemaining.toLocaleString()} {currency} left to save
          </AppText>
        </BentoCard>
      </View>

      
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

     
      <View style={styles.itemsList}>
        {filteredItems.map((item) => {
          const progress = Math.min(1, item.target_amount > 0 ? item.saved_amount / item.target_amount : 0);
          const percentSaved = Math.round(progress * 100);
          const percentLeft = Math.max(0, 100 - percentSaved);
          const amountLeft = Math.max(0, item.target_amount - item.saved_amount);
          const isReady = item.is_purchased === 1 || item.saved_amount >= item.target_amount;

          return (
            <BentoCard key={item.id} variant="light" style={styles.itemCard}>
            
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
                  <AppText variant="caption" color={colors.textSecondary} style={styles.priorityText}>
                    {item.priority}
                  </AppText>
                </View>
              </View>

              {/* Progress & Financial Info */}
              <View
                style={[
                  styles.itemFinancials,
                  {
                    backgroundColor: colors.cardElevated,
                    borderColor: colors.divider,
                  },
                ]}
              >
                <View style={styles.savedRow}>
                  <View>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      Saved
                    </AppText>
                    <AppText variant="bodyBold">
                      {item.saved_amount.toLocaleString()} {currency}
                    </AppText>
                  </View>

                  <View style={styles.alignRight}>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      Target
                    </AppText>
                    <AppText variant="bodyBold">
                      {item.target_amount.toLocaleString()} {currency}
                    </AppText>
                  </View>
                </View>

              
                <View style={styles.progressBarWrap}>
                  <ProgressBar
                    progress={progress}
                    fillColor={isReady ? colors.bambooGreen : colors.categoryTransport}
                    height={8}
                  />
                </View>

                {/* Percent & Amount Remaining Notice */}
                <View style={styles.leftRow}>
                  <View style={styles.percentBadgeGroup}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {isReady ? '100% saved' : `${percentSaved}% saved`}
                    </AppText>
                    {!isReady && (
                      <AppText variant="caption" color={colors.textMuted}>
                        ({percentLeft}% left)
                      </AppText>
                    )}
                  </View>

                  <AppText variant="bodyBold" color={colors.textSecondary}>
                    {isReady ? 'Ready to buy' : `${amountLeft.toLocaleString()} ${currency} left`}
                  </AppText>
                </View>
              </View>

            
              <View style={styles.cardActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => togglePurchased(item)}
                  style={[
                    styles.actionBtn,
                    item.is_purchased === 1
                      ? [styles.actionBtnActive, { backgroundColor: colors.bambooGreen, borderColor: colors.border }]
                      : [styles.actionBtnOutline, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.card, borderColor: colors.border }],
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={item.is_purchased === 1 ? '#FFFFFF' : colors.textPrimary}
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
                      style={[styles.depositBtn, { backgroundColor: isDark ? colors.cardElevated : colors.cardDark, borderColor: colors.border }]}
                    >
                      <AppText variant="caption" color="#FFFFFF">
                        + Deposit saving
                      </AppText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDelete(item)}
                    style={[styles.deleteBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.card, borderColor: colors.border }]}
                  >
                    <AppText variant="caption" color={colors.textSecondary}>
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
              Add your first saving goal with the button above.
            </AppText>
          </BentoCard>
        )}
      </View>

      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="serifTitle">New Wishlist Goal</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  新しい目標 · Add thing to buy
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: colors.border }]}
              >
                <AppText variant="body" color={colors.textPrimary}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

        
            <View style={styles.formGroup}>
              <AppText variant="caption" color={colors.textSecondary}>
                Item name / What to buy
              </AppText>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Sony WH-1000XM5, Trip to Kyoto"
                placeholderTextColor={colors.textMuted}
                style={[styles.formInput, { backgroundColor: isDark ? colors.cardDark : colors.cardElevated, borderColor: colors.border, color: colors.textPrimary }]}
              />
            </View>

           
            <View style={styles.splitRow}>
              <View style={[styles.formGroup, styles.flex1]}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Target cost ({currency})
                </AppText>
                <TextInput
                  value={newTarget}
                  onChangeText={setNewTarget}
                  keyboardType="numeric"
                  placeholder="e.g. 18000"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? colors.cardDark : colors.cardElevated, borderColor: colors.border, color: colors.textPrimary }]}
                />
              </View>

              <View style={[styles.formGroup, styles.flex1]}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Already saved ({currency})
                </AppText>
                <TextInput
                  value={newSaved}
                  onChangeText={setNewSaved}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? colors.cardDark : colors.cardElevated, borderColor: colors.border, color: colors.textPrimary }]}
                />
              </View>
            </View>

            
            <View style={styles.formGroup}>
              <AppText variant="caption" color={colors.textSecondary}>
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

            
            <View style={styles.formGroup}>
              <AppText variant="caption" color={colors.textSecondary}>
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

         
            <View style={styles.formGroup}>
              <AppText variant="caption" color={colors.textSecondary}>
                Note / Description (Optional)
              </AppText>
              <TextInput
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Why do you want this item?"
                placeholderTextColor={colors.textMuted}
                style={[styles.formInput, { backgroundColor: isDark ? colors.cardDark : colors.cardElevated, borderColor: colors.border, color: colors.textPrimary }]}
              />
            </View>

            
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateItem}
              disabled={isSubmitting}
              style={[styles.submitModalBtn, { backgroundColor: isDark ? colors.cardElevated : colors.cardDark, borderColor: colors.border }]}
            >
              <AppText variant="bodyBold" color="#FFFFFF">
                {isSubmitting ? 'Adding...' : 'Create wishlist goal'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    
      <Modal
        visible={depositModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.depositModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <AppText variant="bodyBold">Deposit to Goal</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {depositTargetItem?.title}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setDepositModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: colors.border }]}
              >
                <AppText variant="body" color={colors.textPrimary}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.depositTargetInfo,
                {
                  backgroundColor: colors.cardElevated,
                  borderColor: colors.divider,
                },
              ]}
            >
              <AppText variant="caption" color={colors.textSecondary}>
                Current Saved: {depositTargetItem?.saved_amount.toLocaleString()} {currency} /{' '}
                {depositTargetItem?.target_amount.toLocaleString()} {currency}
              </AppText>
            </View>

            <View style={styles.formGroup}>
              <AppText variant="caption" color={colors.textSecondary}>
                Amount to add ({currency})
              </AppText>
              <TextInput
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="numeric"
                autoFocus={true}
                placeholder="e.g. 1000"
                placeholderTextColor={colors.textMuted}
                style={[styles.formInput, styles.depositBigInput, { backgroundColor: isDark ? colors.cardDark : colors.cardElevated, borderColor: colors.border, color: colors.textPrimary }]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleQuickDeposit}
              style={[
                styles.depositSubmitBtn,
                {
                  backgroundColor: colors.incomeBg,
                  borderColor: colors.incomeBorder,
                },
              ]}
            >
              <AppText variant="bodyBold" color={colors.incomeText}>
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
  priorityText: {
    fontSize: 11,
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
    borderWidth: 1,
    borderColor: Colors.divider,
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
