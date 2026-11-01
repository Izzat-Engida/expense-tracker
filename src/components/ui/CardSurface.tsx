import { createContext, useContext } from 'react';

export type CardSurface = 'light' | 'dark';

/**
 * Tracks the surface tone of the nearest BentoCard so text can pick a
 * foreground palette that stays readable on dark cards in the light theme.
 */
export const CardSurfaceContext = createContext<CardSurface>('light');

export function useCardSurface() {
  return useContext(CardSurfaceContext);
}
