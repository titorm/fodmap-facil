import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, ViewToken, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { OnboardingStackParamList } from '../types/navigation';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { ProgressDots } from '../components/ProgressDots';
import { Button } from '../../../shared/components/atoms/Button';
import { useTheme } from '../../../shared/theme';

type OnboardingScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding'>;

interface SlideData {
  id: string;
  title: string;
  description: string;
  illustration: any;
}

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Onboarding slides data
  const slides: SlideData[] = [
    {
      id: '1',
      title: t('onboarding.slide1.title'),
      description: t('onboarding.slide1.description'),
      illustration: require('../../../../assets/icon.png'), // Using app icon as placeholder
    },
    {
      id: '2',
      title: t('onboarding.slide2.title'),
      description: t('onboarding.slide2.description'),
      illustration: require('../../../../assets/icon.png'), // Using app icon as placeholder
    },
    {
      id: '3',
      title: t('onboarding.slide3.title'),
      description: t('onboarding.slide3.description'),
      illustration: require('../../../../assets/icon.png'), // Using app icon as placeholder
    },
    {
      id: '4',
      title: t('onboarding.slide4.title'),
      description: t('onboarding.slide4.description'),
      illustration: require('../../../../assets/icon.png'), // Using app icon as placeholder
    },
  ];

  const handleComplete = () => {
    navigation.navigate('Disclaimer');
  };

  const handleSkip = () => {
    navigation.navigate('Disclaimer');
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <View
        style={[styles.skipContainer, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}
      >
        <Button
          title={t('onboarding.skip')}
          onPress={handleSkip}
          variant="ghost"
          size="small"
          accessibilityLabel={t('onboarding.skip')}
          accessibilityHint="Skip onboarding and go to disclaimer"
        />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item, index }) => (
          <OnboardingSlide
            title={item.title}
            description={item.description}
            illustration={item.illustration}
            slideNumber={index + 1}
            totalSlides={slides.length}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        scrollEventThrottle={16}
      />

      {/* Progress dots and action button */}
      <View style={[styles.footer, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }]}>
        <ProgressDots total={slides.length} current={currentIndex} />

        <View style={[styles.buttonContainer, { marginTop: spacing.lg }]}>
          {isLastSlide ? (
            <Button
              title={t('onboarding.getStarted')}
              onPress={handleComplete}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel={t('onboarding.getStarted')}
              accessibilityHint="Complete onboarding and continue to disclaimer"
            />
          ) : (
            <View style={{ height: 56 }} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: 'flex-end',
  },
  footer: {
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});
