import * as Notifications from 'expo-notifications';
import { collection, doc, updateDoc, addDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebaseInit';
import { Trip, TripNotification } from '../types';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Initialize notifications
export async function initializeNotifications(): Promise<string | null> {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      // Silently return for demo
      return null;
    }

    // Skip push token for Expo Go demo
    // In production, you would use development builds for full notification support
    if (Platform.OS === 'web') {
      return null;
    }
    
    // For demo, just use local notifications
    console.log('Notifications initialized (local only for demo)');
    return null;
  } catch (error) {
    // Suppress errors for demo
    return null;
  }
}

// Send trip validation notification
export async function sendTripValidationNotification(trip: Trip): Promise<void> {
  try {
    // Create notification content
    const notificationContent = {
      title: '🎯 Trip Completed!',
      body: `You traveled ${(trip.distance / 1000).toFixed(2)} km. Was this trip accurate?`,
      data: {
        tripId: trip.id,
        type: 'trip_validation',
      },
      categoryIdentifier: 'trip_validation',
    };

    // Schedule immediate notification
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Send immediately
    });

    // Save notification to Firestore
    const notification: Omit<TripNotification, 'id'> = {
      tripId: trip.id,
      userId: trip.userId,
      title: notificationContent.title,
      body: notificationContent.body,
      type: 'trip_validation',
      isRead: false,
      createdAt: new Date(),
      responseType: 'pending',
    };

    await addDoc(collection(db, 'notifications'), notification);
  } catch (error) {
    console.error('Error sending trip validation notification:', error);
  }
}

// Send achievement notification
export async function sendAchievementNotification(
  userId: string,
  achievement: string,
  description: string
): Promise<void> {
  try {
    const notificationContent = {
      title: '🏆 Achievement Unlocked!',
      body: `${achievement}: ${description}`,
      data: {
        type: 'achievement',
        achievement,
      },
    };

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });

    // Save to Firestore
    const notification: Omit<TripNotification, 'id'> = {
      tripId: '',
      userId,
      title: notificationContent.title,
      body: notificationContent.body,
      type: 'achievement',
      isRead: false,
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'notifications'), notification);
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

// Handle trip validation response
export async function handleTripValidation(
  tripId: string,
  isValid: boolean
): Promise<void> {
  try {
    // Update trip validation status
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      isValidated: true,
      validationResponse: isValid,
      validatedAt: new Date(),
    });

    // Update notification status in Firestore
    // Query for the notification with this tripId
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('tripId', '==', tripId));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(async (doc) => {
      await updateDoc(doc.ref, {
        responseType: isValid ? 'accepted' : 'rejected',
        respondedAt: new Date(),
        isRead: true,
      });
    });

    console.log(`Trip ${tripId} validated: ${isValid}`);

    if (isValid) {
      // Award bonus points for validation
      const bonusPoints = 10;
      // Get current points and add bonus
      const tripDoc = await getDoc(tripRef);
      const currentPoints = tripDoc.data()?.points || 0;
      await updateDoc(tripRef, {
        points: currentPoints + bonusPoints,
        bonusPoints: bonusPoints,
      });
      
      // Show success notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Validation Bonus!',
          body: `You earned ${bonusPoints} bonus points for validating your trip!`,
          data: { type: 'bonus' },
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error handling trip validation:', error);
  }
}

// Setup notification action categories (for iOS)
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('trip_validation', [
    {
      identifier: 'yes',
      buttonTitle: 'Yes, accurate ✅',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'no',
      buttonTitle: 'No, incorrect ❌',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

// Listen for notification responses
export function addNotificationResponseListener(): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    if (data.type === 'trip_validation' && data.tripId) {
      // Handle default tap (not Yes/No button)
      if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Show a prompt to validate
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Validate Your Trip',
            body: 'Please use the Yes or No buttons to validate your trip accuracy.',
            data: { ...data },
            categoryIdentifier: 'trip_validation',
          },
          trigger: null,
        });
      } else if (actionIdentifier === 'yes') {
        await handleTripValidation(data.tripId as string, true);
        // Show immediate feedback
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '✅ Trip Validated',
            body: 'Thank you! Your trip has been marked as accurate.',
            data: { type: 'feedback' },
          },
          trigger: null,
        });
      } else if (actionIdentifier === 'no') {
        await handleTripValidation(data.tripId as string, false);
        // Show immediate feedback
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📝 Feedback Received',
            body: 'Thank you for letting us know. We\'ll improve our tracking.',
            data: { type: 'feedback' },
          },
          trigger: null,
        });
      }
    }
  });
}

// Schedule daily reminder
export async function scheduleDailyReminder(): Promise<void> {
  try {
    // For demo, just schedule a single reminder 24 hours from now
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Start Your Green Journey!',
        body: 'Track your eco-friendly trips today and earn rewards!',
        data: { type: 'reminder' },
      },
      trigger: null, // Send immediately for demo, or use seconds for delay
    });
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
}