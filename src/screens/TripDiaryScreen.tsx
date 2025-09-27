import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebaseInit';
import { Trip, TransportMode } from '../types';
import { TripMapView } from '../components/TripMapView';
import { useFocusEffect, useRoute } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export const TripDiaryScreen: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalCO2Saved: 0,
    totalPoints: 0,
  });
  const route = useRoute<any>();

  // Refresh trips when screen is focused or when refresh param changes
  useFocusEffect(
    React.useCallback(() => {
      fetchTrips();
    }, [route.params?.refresh])
  );

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const tripsRef = collection(db, 'trips');
      // Note: orderBy requires a Firestore index. 
      // For demo, we'll just filter by userId and sort locally
      const q = query(
        tripsRef,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const fetchedTrips: Trip[] = [];
      let totalDistance = 0;
      let totalCO2 = 0;
      let totalPoints = 0;

      querySnapshot.forEach((doc) => {
        const tripData = { id: doc.id, ...doc.data() } as Trip;
        fetchedTrips.push(tripData);
        totalDistance += tripData.distance || 0;
        totalCO2 += tripData.co2Saved || 0;
        totalPoints += tripData.points || 0;
      });
      
      // Sort trips by createdAt locally (newest first)
      fetchedTrips.sort((a, b) => {
        const aTime = a.createdAt ? (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setTrips(fetchedTrips);
      setStats({
        totalTrips: fetchedTrips.length,
        totalDistance: totalDistance / 1000, // Convert to km
        totalCO2Saved: totalCO2,
        totalPoints: totalPoints,
      });

      if (fetchedTrips.length > 0) {
        setSelectedTrip(fetchedTrips[0]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load trips');
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case TransportMode.WALKING: return '🚶';
      case TransportMode.CYCLING: return '🚴';
      case TransportMode.BIKE: return '🏍️';
      case TransportMode.CAR: return '🚗';
      case TransportMode.BUS: return '🚌';
      case TransportMode.TRAIN: return '🚂';
      case TransportMode.PUBLIC_TRANSPORT: return '🚌';
      case TransportMode.OTHER: return '🚀';
      default: return '❓';
    }
  };

  const getPolylineColor = (mode: TransportMode) => {
    switch (mode) {
      case TransportMode.WALKING: return '#4CAF50';
      case TransportMode.CYCLING: return '#2196F3';
      case TransportMode.BIKE: return '#FF5722';
      case TransportMode.CAR: return '#FF9800';
      case TransportMode.BUS: return '#9C27B0';
      case TransportMode.TRAIN: return '#795548';
      case TransportMode.PUBLIC_TRANSPORT: return '#9C27B0';
      case TransportMode.OTHER: return '#607D8B';
      default: return '#666666';
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading your trips...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Statistics Section */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Green Journey</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalTrips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Km Traveled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCO2Saved.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Kg CO₂ Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
        </View>
      </View>

      {/* Map Section */}
      {selectedTrip && selectedTrip.waypoints && selectedTrip.waypoints.length > 0 ? (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <TripMapView selectedTrip={selectedTrip} getPolylineColor={getPolylineColor} />
        </View>
      ) : (
        <View style={styles.noMapContainer}>
          <Text style={styles.noMapText}>
            {trips.length === 0 
              ? 'Start tracking your trips to see them on the map!' 
              : 'Select a trip to view its route'}
          </Text>
        </View>
      )}

      {/* Trips List */}
      <View style={styles.tripsSection}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {trips.length > 0 ? (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={[
                styles.tripCard,
                selectedTrip?.id === trip.id && styles.selectedTripCard,
              ]}
              onPress={() => setSelectedTrip(trip)}
            >
              <View style={styles.tripHeader}>
                <Text style={styles.tripIcon}>{getTransportIcon(trip.transportMode)}</Text>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripDate}>{formatDate(trip.startTime)}</Text>
                  <Text style={styles.tripMode}>
                    {trip.transportMode.replace('_', ' ').charAt(0).toUpperCase() + 
                     trip.transportMode.slice(1).replace('_', ' ')}
                  </Text>
                  {trip.purpose && (
                    <Text style={styles.tripPurpose}>
                      Purpose: {trip.purpose}
                    </Text>
                  )}
                </View>
                {trip.isValidated && (
                  <View style={styles.validatedBadge}>
                    <Text style={styles.validatedText}>✓</Text>
                  </View>
                )}
              </View>
              <View style={styles.tripDetails}>
                <View style={styles.tripStat}>
                  <Text style={styles.tripStatLabel}>Distance</Text>
                  <Text style={styles.tripStatValue}>
                    {(trip.distance / 1000).toFixed(2)} km
                  </Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripStatLabel}>Duration</Text>
                  <Text style={styles.tripStatValue}>
                    {formatDuration(trip.duration)}
                  </Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripStatLabel}>CO₂ Saved</Text>
                  <Text style={styles.tripStatValue}>
                    {trip.co2Saved?.toFixed(2) || '0'} kg
                  </Text>
                </View>
                <View style={styles.tripStat}>
                  <Text style={styles.tripStatLabel}>Points</Text>
                  <Text style={styles.tripStatValue}>{trip.points || 0}</Text>
                </View>
              </View>
              
              {/* Additional Trip Info */}
              {(trip.purpose || trip.companions !== undefined || trip.cost !== undefined || trip.frequency !== undefined) && (
                <View style={styles.additionalInfo}>
                  {trip.purpose && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Purpose:</Text>
                      <Text style={styles.infoValue}>{trip.purpose}</Text>
                    </View>
                  )}
                  {trip.companions !== undefined && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Companions:</Text>
                      <Text style={styles.infoValue}>{trip.companions}</Text>
                    </View>
                  )}
                  {trip.cost !== undefined && trip.cost > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Estimated Cost:</Text>
                      <Text style={styles.infoValue}>₹{trip.cost.toFixed(2)}</Text>
                    </View>
                  )}
                  {trip.frequency !== undefined && trip.frequency > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Trip Frequency:</Text>
                      <Text style={styles.infoValue}>
                        {trip.frequency < 1 
                          ? `${(trip.frequency * 7).toFixed(1)} times/week`
                          : `${trip.frequency.toFixed(1)}/week`
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚀</Text>
            <Text style={styles.emptyText}>No trips yet!</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your eco-friendly journeys
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  mapSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  map: {
    width: screenWidth - 40,
    height: 250,
    borderRadius: 10,
  },
  noMapContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  noMapText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  tripsSection: {
    padding: 20,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedTripCard: {
    borderColor: '#2e7d32',
    borderWidth: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tripIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tripMode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tripPurpose: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
    fontStyle: 'italic',
  },
  validatedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validatedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripStat: {
    alignItems: 'center',
  },
  tripStatLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  tripStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  additionalInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
});
