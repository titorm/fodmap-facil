import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../shared/hooks/useAuth';
import { useOnboarding } from '../features/onboarding/hooks';
import { OnboardingStackParamList } from '../features/onboarding/types/navigation';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import {
  OnboardingScreen,
  DisclaimerScreen,
  ReadinessAssessmentScreen,
} from '../features/onboarding/screens';
import { ReintroductionHomeScreen } from '../features/reintroduction/screens/ReintroductionHomeScreen';
import { JourneyScreen } from '../features/journey/screens/JourneyScreen';
import { DiaryScreen } from '../features/diary/screens/DiaryScreen';
import { ReportsScreen } from '../features/reports/screens/ReportsScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import {
  TestStartScreen,
  TestDayScreen,
  TestCompleteScreen,
} from '../features/test-wizard/screens';
import { QuickSymptomEntryModal } from '../features/diary/components/QuickSymptomEntryModal';
import { WashoutScreen } from '../features/washout/screens/WashoutScreen';
import { useTheme } from '../shared/theme';
import { subscribeToDeepLinks, type DeepLinkAction } from './deepLinking';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const TestWizardStack = createNativeStackNavigator();

// Navigation param types
export type RootStackParamList = {
  SignIn: undefined;
  OnboardingFlow: undefined;
  Main: undefined;
  TestWizardFlow: {
    testStepId: string;
    foodItem: string;
    fodmapGroup: string;
    testSequence: number;
  };
  WashoutScreen: {
    washoutPeriodId: string;
    userId: string;
  };
};

export type TestWizardStackParamList = {
  TestStart: {
    testStepId: string;
    foodItem: string;
    fodmapGroup: string;
    testSequence: number;
  };
  TestDay: {
    testStepId: string;
  };
  TestComplete: {
    testStepId: string;
  };
};

function MainTabs() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary500,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={JourneyScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel:
            'Home tab - Journey dashboard showing your protocol progress and next steps',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Diário"
        component={DiaryScreen}
        options={{
          tabBarLabel: 'Diário',
          tabBarAccessibilityLabel: 'Diary tab - Log and view your symptoms',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Testes"
        component={ReintroductionHomeScreen}
        options={{
          tabBarLabel: 'Testes',
          tabBarAccessibilityLabel: 'Tests tab - View and manage your food reintroduction tests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Relatórios"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Relatórios',
          tabBarAccessibilityLabel: 'Reports tab - View your progress reports and insights',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarAccessibilityLabel: 'Profile tab - Manage your account and settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function OnboardingFlow() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      <OnboardingStack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <OnboardingStack.Screen name="ReadinessAssessment" component={ReadinessAssessmentScreen} />
    </OnboardingStack.Navigator>
  );
}

// Wrapper components for test wizard screens to integrate with navigation
function TestStartScreenWrapper({ route, navigation }: any) {
  const { testStepId, foodItem, fodmapGroup, testSequence } = route.params;

  return (
    <TestStartScreen
      foodItem={foodItem}
      fodmapGroup={fodmapGroup}
      testSequence={testSequence}
      onStart={() => {
        navigation.navigate('TestDay', { testStepId });
      }}
    />
  );
}

// Wrapper component for WashoutScreen to integrate with navigation
function WashoutScreenWrapper({ route }: any) {
  const { washoutPeriodId, userId } = route.params;

  return <WashoutScreen washoutPeriodId={washoutPeriodId} userId={userId} />;
}

function TestDayScreenWrapper({ route, navigation }: any) {
  const { testStepId } = route.params;
  const [symptomModalVisible, setSymptomModalVisible] = useState(false);

  return (
    <>
      <TestDayScreen
        testStepId={testStepId}
        onQuickSymptomEntry={() => setSymptomModalVisible(true)}
        onComplete={() => {
          navigation.navigate('TestComplete', { testStepId });
        }}
      />
      <QuickSymptomEntryModal
        visible={symptomModalVisible}
        onClose={() => setSymptomModalVisible(false)}
        testStepId={testStepId}
      />
    </>
  );
}

function TestCompleteScreenWrapper({ route, navigation }: any) {
  const { testStepId } = route.params;

  return (
    <TestCompleteScreen
      testStepId={testStepId}
      onNavigateToDashboard={() => {
        // Navigate back to main tabs and close modal
        navigation.getParent()?.goBack();
      }}
    />
  );
}

function TestWizardFlow({ route }: any) {
  const { testStepId, foodItem, fodmapGroup, testSequence } = route.params;

  return (
    <TestWizardStack.Navigator screenOptions={{ headerShown: false }}>
      <TestWizardStack.Screen
        name="TestStart"
        component={TestStartScreenWrapper}
        initialParams={{ testStepId, foodItem, fodmapGroup, testSequence }}
      />
      <TestWizardStack.Screen
        name="TestDay"
        component={TestDayScreenWrapper}
        initialParams={{ testStepId }}
      />
      <TestWizardStack.Screen
        name="TestComplete"
        component={TestCompleteScreenWrapper}
        initialParams={{ testStepId }}
      />
    </TestWizardStack.Navigator>
  );
}

// Context for managing global quick symptom modal
const QuickSymptomContext = React.createContext<{
  openQuickSymptom: (testStepId?: string) => void;
}>({
  openQuickSymptom: () => {},
});

export const useQuickSymptom = () => React.useContext(QuickSymptomContext);

export function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { onboardingState, loading: onboardingLoading } = useOnboarding();
  const [quickSymptomModalVisible, setQuickSymptomModalVisible] = useState(false);
  const [quickSymptomTestStepId, setQuickSymptomTestStepId] = useState<string | undefined>();
  const navigationRef = useRef<any>(null);

  // Handle deep link actions
  const handleDeepLinkAction = (action: DeepLinkAction) => {
    switch (action.type) {
      case 'quick_symptom':
        setQuickSymptomTestStepId(action.testStepId);
        setQuickSymptomModalVisible(true);
        break;
      case 'test_wizard':
        // Navigate to test wizard if navigation is ready
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('TestWizardFlow', {
            testStepId: action.testStepId,
            // These would need to be fetched from the database
            foodItem: 'Unknown',
            fodmapGroup: 'unknown',
            testSequence: 0,
          });
        }
        break;
      case 'washout':
        // Navigate to washout screen if navigation is ready
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('WashoutScreen', {
            washoutPeriodId: action.washoutPeriodId,
            userId: action.userId,
          });
        }
        break;
      case 'navigate':
        // Navigate to specific screen if navigation is ready
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('Main', {
            screen: action.screen,
          });
        }
        break;
    }
  };

  // Subscribe to deep links
  useEffect(() => {
    const unsubscribe = subscribeToDeepLinks(handleDeepLinkAction);
    return unsubscribe;
  }, []);

  if (authLoading || onboardingLoading) {
    return null; // Ou um loading screen
  }

  // Deep linking configuration for React Navigation
  const linking = {
    prefixes: ['fodmap://', 'https://fodmap.app'],
    config: {
      screens: {
        Main: 'main',
        TestWizardFlow: 'test/:testStepId',
        WashoutScreen: 'washout/:washoutPeriodId',
      },
    },
  };

  const openQuickSymptom = (testStepId?: string) => {
    setQuickSymptomTestStepId(testStepId);
    setQuickSymptomModalVisible(true);
  };

  return (
    <QuickSymptomContext.Provider value={{ openQuickSymptom }}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          ) : !onboardingState.completed ? (
            <Stack.Screen name="OnboardingFlow" component={OnboardingFlow} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              {/* Test Wizard Modal Stack */}
              <Stack.Screen
                name="TestWizardFlow"
                component={TestWizardFlow}
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              {/* Washout Screen */}
              <Stack.Screen
                name="WashoutScreen"
                component={WashoutScreenWrapper}
                options={{
                  presentation: 'card',
                  animation: 'slide_from_right',
                  headerShown: false,
                }}
              />
            </>
          )}
        </Stack.Navigator>

        {/* Global Quick Symptom Entry Modal - accessible via deep link */}
        <QuickSymptomEntryModal
          visible={quickSymptomModalVisible}
          onClose={() => {
            setQuickSymptomModalVisible(false);
            setQuickSymptomTestStepId(undefined);
          }}
          testStepId={quickSymptomTestStepId}
        />
      </NavigationContainer>
    </QuickSymptomContext.Provider>
  );
}
