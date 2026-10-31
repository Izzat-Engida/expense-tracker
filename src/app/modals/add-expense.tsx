import React from 'react';
import Main from '@/components/ui/Main';
import { AppText } from '@/components/ui/AppText';

export default function AddExpenseModal() {
  return (
    <Main scrollable={false} edges={['top', 'bottom']}>
      <AppText variant="serifTitle">記録する</AppText>
      <AppText variant="body">Add expense — coming soon.</AppText>
    </Main>
  );
}
