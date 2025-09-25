// User types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  hasConsented: boolean;
  createdAt: Date;
  greenScore: number;
  badges: Badge[];
}

// Trip types
export interface Trip {
  id: string;
  userId: string;
  startLocation: Location;
  endLocation: Location;
  waypoints: Location[];
  startTime: Date;
  endTime: Date;
  distance: number; // in meters
  duration: number; // in seconds
  transportMode: TransportMode;
  isValidated: boolean;
  co2Saved?: number; // in kg
  points?: number;
  createdAt: Date;
  // New fields for enhanced trip data
  purpose?: string;
  companions?: number;
  frequency?: number; // trips per week for similar routes
  cost?: number; // estimated cost in currency units
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
}

export enum TransportMode {
  WALKING = 'walking',
  CYCLING = 'cycling',
  CAR = 'car',
  PUBLIC_TRANSPORT = 'public_transport',
  UNKNOWN = 'unknown'
}

// Gamification types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
  points: number;
  unlockedAt?: Date;
}

export interface BadgeCondition {
  type: 'trips' | 'distance' | 'co2_saved' | 'streak';
  value: number;
  transportMode?: TransportMode;
}

// Notification types
export interface TripNotification {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  body: string;
  type: 'trip_validation' | 'achievement' | 'reminder';
  isRead: boolean;
  createdAt: Date;
  responseType?: 'yes' | 'no' | 'pending';
}

// App state types
export interface AppState {
  isTracking: boolean;
  currentTrip?: Partial<Trip>;
  user?: User;
}