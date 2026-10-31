import React from 'react';
import Main from '@/components/ui/Main';
import { AppText } from '@/components/ui/AppText';

export default function IncomeBudgetModal() {
  return (
    <Main scrollable={false} edges={['top', 'bottom']}>
      <AppText variant="serifTitle">収入 / 予算</AppText>
      <AppText variant="body">Income & budget — coming soon.</AppText>
    </Main>
  );
}
