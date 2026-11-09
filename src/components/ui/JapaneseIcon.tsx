import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type JapaneseIconName =
  | 'torii'      // 鳥居 - Gateway / Security / Protection
  | 'sensu'      // 扇 - Japanese Folding Fan / Aesthetics / Theme
  | 'makimono'   // 巻物 - Scroll / Ledger / Data Archiving
  | 'kumo'       // 雲 - Traditional Stylized Japanese Cloud
  | 'tsuki'      // 月 - Japanese Crescent Moon
  | 'hi'         // 日 - Japanese Rising Sun / Radiance
  | 'tomoe'      // 巴 - Japanese Swirl Crest / Balance / Recurring
  | 'enso'       // 円相 - Zen Brush Circle / Pure / Space
  | 'sakura'     // 桜 - Cherry Blossom Crest
  | 'kiku'       // 菊 - Chrysanthemum Crest / Master
  | 'take'       // 竹 - Bamboo Stalk & Leaves
  | 'kamonLock'  // 蔵鍵 - Japanese Lock & Key
  | 'sweep'      // 掃 - Vessel / Clean Reset
  | 'exit'       // 出門 - Gate / Sign Out
  | 'search'     // 調べ - Minimalist Lens
  | 'exchange'   // 交 - Switch / Cycle
  | 'arrowLeft'  // 左矢 - Back / Return
  | 'chevronLeft'// 戻り - Minimal chevron back
  | 'chevronRight';// 進み - Minimal chevron forward

interface JapaneseIconProps {
  name: JapaneseIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function JapaneseIcon({
  name,
  size = 20,
  color = '#262A28',
  strokeWidth = 1.75,
}: JapaneseIconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  switch (name) {
    case 'torii':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Upper curved lintel (Kasagi) */}
          <Path d="M2.5 6 C8 4.2 16 4.2 21.5 6" />
          {/* Lower crossbeam (Nuki) */}
          <Path d="M4.5 9.5 H19.5" />
          {/* Central strut (Gakuzuka) */}
          <Path d="M12 5.5 V9.5" />
          {/* Pillars (Hashira) */}
          <Path d="M7 6 V21" />
          <Path d="M17 6 V21" />
          {/* Plinths */}
          <Path d="M5 21 H9" />
          <Path d="M15 21 H19" />
        </Svg>
      );

    case 'sensu':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Outer arc of the fan */}
          <Path d="M3.5 14 C4.5 8 8 4 12 4 C16 4 19.5 8 20.5 14" />
          {/* Lower edge fold */}
          <Path d="M6.5 15.5 C8 12.5 10 11 12 11 C14 11 16 12.5 17.5 15.5" />
          {/* Fan ribs radiating to pivot */}
          <Path d="M3.5 14 L12 20 L20.5 14" />
          <Path d="M8 8 L12 20" />
          <Path d="M12 4 L12 20" />
          <Path d="M16 8 L12 20" />
          {/* Pivot rivet */}
          <Circle cx="12" cy="20" r="1" fill={color} />
        </Svg>
      );

    case 'makimono':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Left rolled cylinder */}
          <Rect x="4" y="4.5" width="4" height="15" rx="2" />
          {/* Scroll parchment body */}
          <Path d="M8 5.5 H18.5 C19.5 5.5 20 6.5 20 8 V16.5 C19 15.5 17.5 15.5 16 15.5 H8" />
          {/* Right roller finial */}
          <Path d="M18.5 4.5 V17.5" />
          {/* Text line strokes */}
          <Path d="M10.5 9 H16.5" />
          <Path d="M10.5 12 H15" />
        </Svg>
      );

    case 'kumo':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Traditional Ukiyo-e rounded cloud contours */}
          <Path d="M4 14.5 C4 12 6 11 7.5 11 C8 8.5 10.5 7.5 13 8.5 C15.5 7 18 8 18.5 10.5 C20 11 20.5 12.5 20.5 14 C20.5 16 19 17 17 17 H6.5 C4.5 17 4 16 4 14.5 Z" />
          {/* Inner horizontal cloud accent */}
          <Path d="M7.5 14 H14.5" />
        </Svg>
      );

    case 'tsuki':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Classic Japanese crescent moon (Mikazuki) */}
          <Path d="M15.5 3.5 C9.5 3.5 5 8 5 13.5 C5 19 9.5 20.5 15.5 20.5 C11.5 18.5 9 15 9 12 C9 9 11.5 5.5 15.5 3.5 Z" />
        </Svg>
      );

    case 'hi':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Central sun disk */}
          <Circle cx="12" cy="12" r="4.5" />
          {/* Cardinal rays */}
          <Path d="M12 2.5 V5.5" />
          <Path d="M12 18.5 V21.5" />
          <Path d="M2.5 12 H5.5" />
          <Path d="M18.5 12 H21.5" />
          {/* Ordinal rays */}
          <Path d="M5.5 5.5 L7.8 7.8" />
          <Path d="M16.2 16.2 L18.5 18.5" />
          <Path d="M5.5 18.5 L7.8 16.2" />
          <Path d="M16.2 7.8 L18.5 5.5" />
        </Svg>
      );

    case 'tomoe':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Outer circle crest */}
          <Circle cx="12" cy="12" r="9" />
          {/* Interlocking swirl comma paths (Futatsudomoe) */}
          <Path d="M12 3 C16.5 3 16.5 12 12 12 C7.5 12 7.5 21 12 21" />
          <Circle cx="12" cy="7.5" r="1.5" fill={color} />
          <Circle cx="12" cy="16.5" r="1.5" fill={color} />
        </Svg>
      );

    case 'enso':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Zen brush circle with intentional opening (Yohaku) */}
          <Path
            d="M10.5 3.5 C5.5 4.5 3 8.5 3 13 C3 18 7 21 12.5 21 C17.5 21 21 17.5 21 12 C21 8.5 19 5.5 15.5 4"
            strokeWidth={strokeWidth + 0.5}
          />
        </Svg>
      );

    case 'sakura':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* 5-petal cherry blossom Kamon */}
          <Circle cx="12" cy="12" r="1.5" fill={color} />
          {/* Petals */}
          <Path d="M12 10.5 C10.5 7 10 4.5 12 3 C14 4.5 13.5 7 12 10.5 Z" />
          <Path d="M13.5 11.5 C17 10 19.5 9.5 21 11.5 C19.5 13.5 17 13 13.5 11.5 Z" />
          <Path d="M13 13 C15 16 16 18.5 14 20 C12.5 19 11.5 16.5 13 13 Z" />
          <Path d="M11 13 C9.5 16.5 8.5 19 7 20 C5 18.5 6 16 11 13 Z" />
          <Path d="M10.5 11.5 C7 13 4.5 13.5 3 11.5 C4.5 9.5 7 10 10.5 11.5 Z" />
        </Svg>
      );

    case 'kiku':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Imperial Chrysanthemum Kamon (radial petals) */}
          <Circle cx="12" cy="12" r="2.5" fill={color} />
          <Path d="M12 2.5 V7" />
          <Path d="M12 17 V21.5" />
          <Path d="M2.5 12 H7" />
          <Path d="M17 12 H21.5" />
          <Path d="M5.5 5.5 L8.5 8.5" />
          <Path d="M15.5 15.5 L18.5 18.5" />
          <Path d="M5.5 18.5 L8.5 15.5" />
          <Path d="M15.5 8.5 L18.5 5.5" />
          <Circle cx="12" cy="12" r="9" />
        </Svg>
      );

    case 'take':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Segmented bamboo stalk with elegant leaves */}
          <Path d="M9.5 3 V21" />
          <Path d="M13.5 3 V21" />
          {/* Bamboo nodes */}
          <Path d="M8 9 H15" />
          <Path d="M8 15 H15" />
          {/* Tapered leaves */}
          <Path d="M14 9 C17 7 20 8 21.5 10.5 C19 11 16 10.5 14 9 Z" fill={color} />
          <Path d="M9 15 C6 13 3 14 1.5 16.5 C4 17 7 16.5 9 15 Z" fill={color} />
        </Svg>
      );

    case 'kamonLock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Shackle */}
          <Path d="M7.5 10 V7 C7.5 4.5 9.5 2.5 12 2.5 C14.5 2.5 16.5 4.5 16.5 7 V10" />
          {/* Traditional treasury lock box */}
          <Rect x="5" y="10" width="14" height="11" rx="2" />
          {/* Keyhole */}
          <Circle cx="12" cy="14.5" r="1.5" fill={color} />
          <Path d="M12 16 V18" />
        </Svg>
      );

    case 'sweep':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Clean wooden disposal/clear vessel */}
          <Path d="M4 6.5 H20" />
          <Path d="M9.5 4 H14.5" />
          <Path d="M6.5 6.5 L7.5 19 C7.5 20 8.5 20.5 9.5 20.5 H14.5 C15.5 20.5 16.5 20 16.5 19 L17.5 6.5" />
          <Path d="M10.5 10.5 V16.5" />
          <Path d="M13.5 10.5 V16.5" />
        </Svg>
      );

    case 'exit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          {/* Gateway frame */}
          <Path d="M9 21 H5 C4 21 3 20 3 19 V5 C3 4 4 3 5 3 H9" />
          {/* Arrow stepping through */}
          <Path d="M14 16 L18 12 L14 8" />
          <Path d="M8 12 H18" />
        </Svg>
      );

    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <Circle cx="11" cy="11" r="6.5" />
          <Path d="M16 16 L20.5 20.5" />
        </Svg>
      );

    case 'exchange':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <Path d="M4 8 H17 L14 5" />
          <Path d="M20 16 H7 L10 19" />
        </Svg>
      );

    case 'arrowLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <Path d="M19 12 H5" />
          <Path d="M11 18 L5 12 L11 6" />
        </Svg>
      );

    case 'chevronLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <Path d="M15 19 L8 12 L15 5" />
        </Svg>
      );

    case 'chevronRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" {...common}>
          <Path d="M9 5 L16 12 L9 19" />
        </Svg>
      );

    default:
      return null;
  }
}
