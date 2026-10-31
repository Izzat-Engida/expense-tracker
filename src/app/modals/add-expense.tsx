import React,{useState} from 'react';
import {
View,
StyleSheet,
TouchableOpacity,
TextInput
} from 'react-native';
import {useRouter} from 'expo-router'
import {
Main,
BentoCard,
AppText,
HankoStamp,
PillBadge
} from "@/components/ui";
import {Colors,Fonts} from '@/constants/theme'
const CATEGORIES = ['Food', 'Transport', 'Bills', 'Fun'] as const;
const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function AddExpenseModal() {
  const router=useRouter();
  const [amount,setAmount]=useState('420');
  const [selectedCategory,setSelectedCategory]=useState<string>('Food');
  const [note,setNote]=useState('');

  const handleKeyPress=(key:string)=>{
    if(key==='⌫'){
      setAmount((prev)=>(prev.length>1?prev.slice(0,-1):'0'))
      return;
    }
    if (key==='.' && amount.includes('.')) return;
    setAmount((prev)=>(prev==='0' && key!=='.'? key:prev+key))
  }
  const handleSave=()=>{
    //sql saving logic here latter
    router.back();
  }
  return (
    <Main>
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">Add expense</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <AppText variant="body" color={Colors.textSecondary}>
            ✕
          </AppText>
        </TouchableOpacity>
      </View>
      <BentoCard variant="dark" style={styles.amountCard}>
        <View style={styles.amountTopRow}>
          <AppText variant="caption" color={Colors.textMuted}>
            支出 / Amount
          </AppText>
          <HankoStamp size="sm" />
        </View>

        <View style={styles.lcdRow}>
          <AppText variant="digital" color={Colors.textInverse} style={styles.lcdText}>
            {amount}
          </AppText>
          <View style={styles.cursorLine} />
          <AppText variant="caption" color={Colors.textMuted} style={styles.etbLabel}>
            ETB
          </AppText>
        </View>
      </BentoCard>
      <BentoCard variant="light" style={styles.categoryCard}>
        <AppText variant="caption" color={Colors.textSecondary}>
          Category
        </AppText>
        <View style={styles.categoryPillsRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <PillBadge
                key={cat}
                variant={isSelected ? 'dark' : 'outline'}
                label={cat}
                onPress={() => setSelectedCategory(cat)}
              />
            );
          })}
        </View>
      </BentoCard>
    <View style={styles.splitRow}>
        <BentoCard variant="light" style={styles.noteCard}>
          <AppText variant="caption" color={Colors.textSecondary}>
            Add a note
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional"
            placeholderTextColor={Colors.textMuted}
            style={styles.noteInput}
          />
        </BentoCard>
      <BentoCard variant="dark" style={styles.dateCard}>
          <AppText variant="caption" color={Colors.textMuted}>
            Date
          </AppText>
          <AppText
            variant="caption"
            color={Colors.textInverse}
            style={styles.dateValue}
          >
            Today, 19 October
          </AppText>
        </BentoCard>
    </View>
    <BentoCard variant="light" style={styles.keypadCard}>
        <View style={styles.keypadGrid}>
          {
            KEYPAD_KEYS.map((key)=>(
              <TouchableOpacity
              key={key}
              activeOpacity={0.6}
              onPress={()=>handleKeyPress(key)}
              style={styles.keyButton}
              >
                <AppText style={key==='⌫'? styles.backspaceText:styles.keyText}>
                  {key}
                </AppText>
              </TouchableOpacity>
            ))
          }
        </View>
    </BentoCard>
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        style={styles.saveButton}
      >
        <AppText variant="body" color={Colors.textInverse}>
          Save expense
        </AppText>
      </TouchableOpacity>
    </Main>
  );
}
const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    paddingVertical: 18,
    gap: 12,
  },
  amountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lcdRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  lcdText: {
    fontSize: 44,
  },
  cursorLine: {
    width: 2,
    height: 34,
    backgroundColor: Colors.hankoRed,
    marginLeft: 4,
    marginRight: 10,
    alignSelf: 'center',
  },
  etbLabel: {
    fontSize: 13,
  },
  categoryCard: {
    paddingVertical: 14,
    gap: 10,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noteCard: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  noteInput: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 4,
    marginTop: 4,
  },
  dateCard: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  dateValue: {
    marginTop: 6,
    fontFamily: Fonts.serif,
  },
  keypadCard: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keyButton: {
    width: '33.33%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  backspaceText: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.cardDark,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
});