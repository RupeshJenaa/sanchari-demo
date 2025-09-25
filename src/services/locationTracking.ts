import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseInit';
import { Trip, Location as LocationType, TransportMode } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendTripValidationNotification, sendAchievementNotification } from './notifications';

const LOCATION_TASK_NAME = 'yatra-location-tracking';
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
const MIN_DISTANCE_FILTER = 10; // 10 meters

// Define the background location tracking task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location tracking error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    
    if (location) {
      await handleLocationUpdate(location);
    }
  }
});

// Handle location updates
async function handleLocationUpdate(location: Location.LocationObject) {
  try {
    // Get current trip data from AsyncStorage
    const tripDataString = await AsyncStorage.getItem('currentTrip');
    if (!tripDataString) return;

    const currentTrip = JSON.parse(tripDataString);
    
    // Add location to waypoints
    const newLocation: LocationType = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      altitude: location.coords.altitude || undefined,
      accuracy: location.coords.accuracy || undefined,
      speed: location.coords.speed || undefined,
    };

    currentTrip.waypoints.push(newLocation);
    
    // Calculate distance from previous point
    if (currentTrip.waypoints.length > 1) {
      const prevLocation = currentTrip.waypoints[currentTrip.waypoints.length - 2];
      const distance = calculateDistance(
        prevLocation.latitude,
        prevLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      currentTrip.distance += distance;
    }

    // Detect transport mode based on speed
    if (location.coords.speed !== null) {
      currentTrip.transportMode = detectTransportMode(location.coords.speed);
    }

    // Update AsyncStorage
    await AsyncStorage.setItem('currentTrip', JSON.stringify(currentTrip));
  } catch (error) {
    console.error('Error handling location update:', error);
  }
}

// Start tracking location
export async function startLocationTracking(userId: string): Promise<string> {
  try {
    // Request permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      throw new Error('Background location permission not granted');
    }

    // Get current location as starting point
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Create new trip
    const newTrip: Partial<Trip> = {
      userId,
      startLocation: {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: currentLocation.timestamp,
      },
      waypoints: [],
      startTime: new Date(),
      distance: 0,
      transportMode: TransportMode.UNKNOWN,
      isValidated: false,
      createdAt: new Date(),
    };

    // Save initial trip data to AsyncStorage
    await AsyncStorage.setItem('currentTrip', JSON.stringify(newTrip));

    // Start background location tracking
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_UPDATE_INTERVAL,
      distanceInterval: MIN_DISTANCE_FILTER,
      foregroundService: {
        notificationTitle: 'Yatra Trip Tracking',
        notificationBody: 'Recording your green journey...',
        notificationColor: '#2e7d32',
      },
    });

    return 'tracking_started';
  } catch (error: any) {
    console.error('Error starting location tracking:', error);
    throw error;
  }
}

// Stop tracking location and return trip data for completion form
export async function stopLocationTracking(userId: string): Promise<Partial<Trip> | null> {
  try {
    // Stop background location tracking
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

    // Get final location
    const finalLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Retrieve trip data from AsyncStorage
    const tripDataString = await AsyncStorage.getItem('currentTrip');
    if (!tripDataString) return null;

    const tripData = JSON.parse(tripDataString);

    // Complete basic trip data
    tripData.endLocation = {
      latitude: finalLocation.coords.latitude,
      longitude: finalLocation.coords.longitude,
      timestamp: finalLocation.timestamp,
    };
    tripData.endTime = new Date();
    tripData.duration = (tripData.endTime.getTime() - new Date(tripData.startTime).getTime()) / 1000; // in seconds

    // Calculate CO2 saved and points
    tripData.co2Saved = calculateCO2Saved(tripData.distance, tripData.transportMode);
    tripData.points = calculatePoints(tripData.distance, tripData.transportMode);
    
    // Calculate cost
    tripData.cost = calculateTripCost(tripData.distance, tripData.transportMode);
    
    // Calculate frequency
    tripData.frequency = await calculateTripFrequency(
      userId,
      tripData.startLocation,
      tripData.endLocation,
      tripData.transportMode
    );

    // Return incomplete trip data for form completion
    return tripData as Partial<Trip>;
  } catch (error: any) {
    console.error('Error stopping location tracking:', error);
    throw error;
  }
}

// Complete and save trip with purpose and companions data
export async function completeTrip(
  tripData: Partial<Trip>,
  purpose: string,
  companions: number
): Promise<Trip> {
  try {
    // Add purpose and companions
    tripData.purpose = purpose;
    tripData.companions = companions;

    // Save trip to Firestore
    const tripRef = await addDoc(collection(db, 'trips'), tripData);
    const completeTrip = { ...tripData, id: tripRef.id } as Trip;

    // Send validation notification
    await sendTripValidationNotification(completeTrip);

    // Check for achievements
    if (tripData.co2Saved && tripData.co2Saved >= 1) {
      await sendAchievementNotification(
        tripData.userId!,
        'CO₂ Saver',
        `You saved ${tripData.co2Saved.toFixed(2)} kg of CO₂!`
      );
    }

    // Clear AsyncStorage
    await AsyncStorage.removeItem('currentTrip');

    return completeTrip;
  } catch (error: any) {
    console.error('Error completing trip:', error);
    throw error;
  }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Detect transport mode based on speed (m/s)
function detectTransportMode(speed: number): TransportMode {
  const kmh = speed * 3.6; // Convert m/s to km/h
  
  if (kmh < 7) return TransportMode.WALKING;
  if (kmh < 25) return TransportMode.CYCLING;
  if (kmh < 80) return TransportMode.CAR;
  return TransportMode.PUBLIC_TRANSPORT;
}

// Calculate CO2 saved based on transport mode (in kg)
function calculateCO2Saved(distance: number, mode: TransportMode): number {
  const distanceKm = distance / 1000;
  
  // CO2 emissions per km (kg CO2/km)
  const emissions = {
    car: 0.171, // Average car emissions
    bus: 0.089, // Public transport
    walking: 0,
    cycling: 0,
  };
  
  // Calculate savings compared to car travel
  switch (mode) {
    case TransportMode.WALKING:
      return distanceKm * emissions.car; // Full savings
    case TransportMode.CYCLING:
      return distanceKm * emissions.car; // Full savings
    case TransportMode.PUBLIC_TRANSPORT:
      return distanceKm * (emissions.car - emissions.bus);
    case TransportMode.CAR:
      return 0; // No savings
    default:
      return 0;
  }
}

// Calculate points based on distance and transport mode
function calculatePoints(distance: number, mode: TransportMode): number {
  const distanceKm = distance / 1000;
  
  switch (mode) {
    case TransportMode.WALKING:
      return Math.round(distanceKm * 10); // 10 points per km
    case TransportMode.CYCLING:
      return Math.round(distanceKm * 8); // 8 points per km
    case TransportMode.PUBLIC_TRANSPORT:
      return Math.round(distanceKm * 5); // 5 points per km
    case TransportMode.CAR:
      return Math.round(distanceKm * 1); // 1 point per km
    default:
      return 0;
  }
}

// Calculate estimated trip cost based on transport mode and distance
function calculateTripCost(distance: number, mode: TransportMode): number {
  const distanceKm = distance / 1000;
  
  // Cost per km in currency units (can be adjusted based on local rates)
  const costRates = {
    walking: 0, // Free
    cycling: 0.05, // Minimal maintenance cost
    public_transport: 2.5, // Average public transport rate per km
    car: 0.5, // Fuel + maintenance per km
    unknown: 0
  };
  
  switch (mode) {
    case TransportMode.WALKING:
      return 0;
    case TransportMode.CYCLING:
      return distanceKm * costRates.cycling;
    case TransportMode.PUBLIC_TRANSPORT:
      return distanceKm * costRates.public_transport;
    case TransportMode.CAR:
      return distanceKm * costRates.car;
    default:
      return 0;
  }
}

// Calculate trip frequency based on similar past trips
async function calculateTripFrequency(
  userId: string,
  startLocation: LocationType,
  endLocation: LocationType,
  transportMode: TransportMode
): Promise<number> {
  try {
    // Query for similar trips in the past 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const tripsRef = collection(db, 'trips');
    const q = query(
      tripsRef,
      where('userId', '==', userId),
      where('transportMode', '==', transportMode)
    );
    
    const querySnapshot = await getDocs(q);
    let similarTrips = 0;
    
    // Define proximity threshold (500 meters)
    const proximityThreshold = 500;
    
    querySnapshot.forEach((doc) => {
      const trip = doc.data() as Trip;
      const tripDate = trip.createdAt ? 
        (trip.createdAt as any).toDate ? (trip.createdAt as any).toDate() : new Date(trip.createdAt) 
        : new Date();
      
      // Check if trip is within the last 4 weeks
      if (tripDate >= fourWeeksAgo) {
        // Calculate distance between start points
        const startDistance = calculateDistance(
          startLocation.latitude,
          startLocation.longitude,
          trip.startLocation.latitude,
          trip.startLocation.longitude
        );
        
        // Calculate distance between end points
        const endDistance = calculateDistance(
          endLocation.latitude,
          endLocation.longitude,
          trip.endLocation.latitude,
          trip.endLocation.longitude
        );
        
        // If both start and end are within proximity threshold, consider it similar
        if (startDistance <= proximityThreshold && endDistance <= proximityThreshold) {
          similarTrips++;
        }
      }
    });
    
    // Calculate frequency per week
    return similarTrips / 4; // trips per week
  } catch (error) {
    console.error('Error calculating trip frequency:', error);
    return 0;
  }
}
