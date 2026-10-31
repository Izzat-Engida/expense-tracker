import React from 'react';
import Main from '@/components/ui/Main';
import { AppText } from '@/components/ui/AppText';

export default function SyncStatusModal() {
  return (
    <Main scrollable={false} edges={['top', 'bottom']}>
      <AppText variant="serifTitle">同期</AppText>
      <AppText variant="body">Sync status — coming soon.</AppText>
    </Main>
  );
}
