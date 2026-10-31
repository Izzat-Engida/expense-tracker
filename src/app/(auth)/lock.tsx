import React from 'react';
import Main from '@/components/ui/Main';
import { AppText } from '@/components/ui/AppText';

export default function LockScreen() {
  return (
    <Main scrollable={false}>
      <AppText variant="serifTitle">🔒</AppText>
      <AppText variant="body">Lock screen — coming soon.</AppText>
    </Main>
  );
}
