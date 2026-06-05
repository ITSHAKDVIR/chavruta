/**
 * KeyboardScroll — ScrollView that pushes content above the keyboard.
 *
 * Wraps ScrollView in KeyboardAvoidingView so any TextInput at the bottom of
 * a long form stays visible when the keyboard opens. Use as a drop-in
 * replacement for `<ScrollView>` on screens with input fields.
 *
 * Uses forwardRef so callers can grab the inner ScrollView ref for
 * scrollToEnd / scrollTo operations (e.g. chat surfaces).
 */
import React, { forwardRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';

export type KeyboardScrollProps = ScrollViewProps & {
  /** Extra offset above the keyboard. Default 0. */
  extraOffset?: number;
  /** Wrapper style around the KeyboardAvoidingView. */
  wrapperStyle?: ViewStyle;
};

export const KeyboardScroll = forwardRef<ScrollView, KeyboardScrollProps>(
  function KeyboardScroll(
    {
      children,
      extraOffset = 0,
      wrapperStyle,
      keyboardShouldPersistTaps = 'handled',
      ...scrollProps
    },
    ref,
  ) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={extraOffset}
        style={[styles.flex, wrapperStyle]}
      >
        <ScrollView
          ref={ref}
          {...scrollProps}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  },
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
