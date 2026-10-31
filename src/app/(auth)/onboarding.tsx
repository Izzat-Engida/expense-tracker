import React from 'react';
import Main from '@/components/ui/Main';
import { AppText } from '@/components/ui/AppText';

export default function OnboardingScreen() {
  return (
    <Main scrollable={false}>
      <AppText variant="serifTitle">余白</AppText>
      <AppText variant="body">Onboarding — coming soon.</AppText>
    </Main>
  );
}
