/**
 * HeroCarousel — overlap-stacked 3-card carousel with smooth transitions.
 *
 * Three cards are absolutely positioned at the same spot. The center card
 * sits on top, the others peek from left & right. When the user swipes,
 * the new center transitions in smoothly via Animated.spring — the side
 * cards don't just snap, they ANIMATE between positions.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { Icon, IconName } from './Icon';

export type HeroCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  route: string;
};

type Props = {
  cards: HeroCard[];
  onPress: (card: HeroCard) => void;
  initialIndex?: number;
};

export function HeroCarousel({ cards, onPress, initialIndex }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const CARD_WIDTH = Math.min(280, Math.round(screenWidth * 0.7));
  const CARD_HEIGHT = 230;

  // Position of each card stored as Animated value (its "role offset" in the
  // ring). 0 = center, -1 = left peek, +1 = right peek, others = hidden.
  // When the user swipes, we animate THIS to the new offset — cards slide
  // smoothly between positions instead of teleporting.
  const positions = useRef(
    cards.map((_, i) => {
      const initCenter = initialIndex !== undefined ? initialIndex : Math.floor(cards.length / 2);
      let off = i - initCenter;
      // Normalize so cards on the far side wrap around
      if (off > cards.length / 2) off -= cards.length;
      if (off < -cards.length / 2) off += cards.length;
      return new Animated.Value(off);
    }),
  ).current;

  const [centerIdx, setCenterIdx] = useState(
    initialIndex !== undefined ? initialIndex : Math.floor(cards.length / 2),
  );

  // When centerIdx changes, animate each card to its new position
  useEffect(() => {
    const animations = positions.map((pos, i) => {
      let off = i - centerIdx;
      if (off > cards.length / 2) off -= cards.length;
      if (off < -cards.length / 2) off += cards.length;
      return Animated.spring(pos, {
        toValue: off,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      });
    });
    Animated.parallel(animations).start();
  }, [centerIdx, cards.length, positions]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 50) {
          setCenterIdx((i) => (i - 1 + cards.length) % cards.length);
        } else if (gs.dx < -50) {
          setCenterIdx((i) => (i + 1) % cards.length);
        }
      },
    }),
  ).current;

  return (
    <View style={{ height: CARD_HEIGHT + 36 }}>
      <View style={[styles.stage, { height: CARD_HEIGHT }]} {...panResponder.panHandlers}>
        {cards.map((card, i) => {
          // Each card's transform interpolates from its position value:
          //   pos=0 (center)  → translateX 0, scale 1, opacity 1, zIndex 3
          //   pos=±1 (sides) → translateX ±55%, scale 0.82, opacity 0.5
          //   |pos|>1 → hidden behind
          const translateX = positions[i].interpolate({
            inputRange: [-2, -1, 0, 1, 2],
            outputRange: [
              -CARD_WIDTH * 0.9,
              -CARD_WIDTH * 0.55,
              0,
              CARD_WIDTH * 0.55,
              CARD_WIDTH * 0.9,
            ],
          });
          const scale = positions[i].interpolate({
            inputRange: [-2, -1, 0, 1, 2],
            outputRange: [0.7, 0.82, 1, 0.82, 0.7],
          });
          const opacity = positions[i].interpolate({
            inputRange: [-2, -1, 0, 1, 2],
            outputRange: [0, 0.55, 1, 0.55, 0],
          });
          // We can't animate zIndex with native driver — use static value based
          // on current center. Cards close to center get higher z.
          const isCenter = i === centerIdx;
          const zIndex = isCenter ? 3 : 1;

          return (
            <Animated.View
              key={card.id}
              style={[
                styles.cardBox,
                {
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  transform: [{ translateX }, { scale }],
                  opacity,
                  zIndex,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  if (isCenter) onPress(card);
                  else setCenterIdx(i);
                }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={isCenter ? ['#2c5282', '#1e3a5f'] : ['#1e3a5f', '#0a1f3d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, isCenter ? styles.cardCenter : styles.cardSide]}
                >
                  <View style={styles.iconHolder}>
                    <Icon
                      name={card.icon}
                      size={36}
                      color={'rgba(255,255,255,0.95)'}
                      strokeWidth={1.4}
                    />
                  </View>
                  <Text
                    style={[
                      typography.h2,
                      { color: '#fff', textAlign: 'center', fontWeight: '700' },
                    ]}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: 'rgba(255,255,255,0.75)',
                        textAlign: 'center',
                        marginTop: 4,
                      },
                    ]}
                  >
                    {card.subtitle}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === centerIdx && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBox: {
    position: 'absolute',
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 14,
  },
  cardSide: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  iconHolder: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    height: 18,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
});
