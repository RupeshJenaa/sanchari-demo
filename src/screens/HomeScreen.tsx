import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { startLocationTracking, stopLocationTracking, completeTrip } from '../services/locationTracking';
import { auth } from '../services/firebaseInit';
import { TransportMode, Trip } from '../types';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { TripCompletionForm } from '../components/TripCompletionForm';

export const HomeScreen: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [pendingTripData, setPendingTripData] = useState<Partial<Trip> | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && trackingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - trackingStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, trackingStartTime]);

  const handleStartTracking = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      await startLocationTracking(userId);
      setIsTracking(true);
      setTrackingStartTime(new Date());
      setElapsedTime(0);
      Alert.alert('Success', 'Trip tracking started!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleStopTracking = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const tripData = await stopLocationTracking(userId);
      setIsTracking(false);
      setTrackingStartTime(null);
      setElapsedTime(0);

      if (tripData) {
        // Show trip completion form
        setPendingTripData(tripData);
        setShowCompletionForm(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleTripCompletion = async (purpose: string, companions: number) => {
    try {
      if (!pendingTripData) return;

      const completedTrip = await completeTrip(pendingTripData, purpose, companions);
      setShowCompletionForm(false);
      setPendingTripData(null);

      Alert.alert(
        'Trip Completed!',
        `Distance: ${((completedTrip.distance || 0) / 1000).toFixed(2)} km\n` +
        `Duration: ${formatDuration(completedTrip.duration || 0)}\n` +
        `CO₂ Saved: ${(completedTrip.co2Saved || 0).toFixed(2)} kg\n` +
        `Points Earned: ${completedTrip.points || 0}\n` +
        `Purpose: ${completedTrip.purpose}\n` +
        `Companions: ${completedTrip.companions}`,
        [
          {
            text: 'View in Diary',
            onPress: () => {
              navigation.navigate('TripDiary', { refresh: Date.now() });
            }
          },
          {
            text: 'View Profile',
            onPress: () => {
              navigation.navigate('Profile');
            }
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save trip details');
    }
  };

  const handleFormCancel = () => {
    setShowCompletionForm(false);
    // Still save the trip but without additional details
    if (pendingTripData) {
      handleTripCompletion('Not specified', 0);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Sanchari</Text>
          <Text style={styles.subtitle}>Start your eco-friendly journey</Text>
        </View>

        <View style={styles.trackingCard}>
          {isTracking ? (
            <>
              <View style={styles.trackingActive}>
                <Text style={styles.trackingStatus}>Trip in Progress</Text>
                <Text style={styles.timer}>{formatDuration(elapsedTime)}</Text>
                <View style={styles.pulseContainer}>
                  <View style={styles.pulse} />
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.button, styles.stopButton]}
                onPress={handleStopTracking}
              >
                <Text style={styles.buttonText}>Stop Tracking</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.readyText}>Ready to track your trip?</Text>
              <TouchableOpacity 
                style={[styles.button, styles.startButton]}
                onPress={handleStartTracking}
              >
                <Text style={styles.buttonText}>Start Tracking</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>Tap "Start Tracking" when you begin your trip</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>We'll track your route and transport mode</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>Stop tracking when you reach your destination</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>4</Text>
            <Text style={styles.infoText}>Earn points for eco-friendly travel!</Text>
          </View>
        </View>

        <View style={styles.transportModes}>
          <Text style={styles.modesTitle}>Supported Transport Modes:</Text>
          <View style={styles.modesList}>
            <View style={styles.modeItem}>
              <Text style={styles.modeIcon}>🚶</Text>
              <Text style={styles.modeText}>Walking</Text>
            </View>
            <View style={styles.modeItem}>
              <Text style={styles.modeIcon}>🚴</Text>
              <Text style={styles.modeText}>Cycling</Text>
            </View>
            <View style={styles.modeItem}>
              <Text style={styles.modeIcon}>🚌</Text>
              <Text style={styles.modeText}>Transport</Text>
            </View>
            <View style={styles.modeItem}>
              <Text style={styles.modeIcon}>🚗</Text>
              <Text style={styles.modeText}>Car</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Trip Completion Form */}
      <TripCompletionForm
        visible={showCompletionForm}
        onComplete={handleTripCompletion}
        onCancel={handleFormCancel}
        tripDistance={(pendingTripData?.distance || 0) / 1000}
        tripDuration={pendingTripData?.duration || 0}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  trackingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
  },
  trackingActive: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trackingStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  timer: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  pulseContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4caf50',
    opacity: 0.8,
  },
  readyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4caf50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  infoNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2e7d32',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  transportModes: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  modesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modesList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modeItem: {
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  modeText: {
    fontSize: 12,
    color: '#666',
  },
});