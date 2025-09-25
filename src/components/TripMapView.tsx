import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { Trip, TransportMode } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface TripMapProps {
  selectedTrip: Trip;
  getPolylineColor: (mode: TransportMode) => string;
}

export const TripMapView: React.FC<TripMapProps> = ({ selectedTrip, getPolylineColor }) => {
  const transportColor = getPolylineColor(selectedTrip.transportMode);
  
  return (
    <View style={styles.mapContainer}>
      <View style={[styles.routeHeader, { backgroundColor: transportColor + '20' }]}>
        <Text style={styles.routeTitle}>Trip Route</Text>
      </View>
      
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.transportModeText}>
          {selectedTrip.transportMode.replace('_', ' ').toUpperCase()} TRIP
        </Text>
        
        <View style={styles.routeInfo}>
          <View style={styles.locationBox}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationLabel}>START</Text>
              <Text style={styles.locationCoords}>
                {selectedTrip.startLocation.latitude.toFixed(4)}°, {selectedTrip.startLocation.longitude.toFixed(4)}°
              </Text>
            </View>
          </View>
          
          <View style={[styles.routeLine, { borderColor: transportColor }]} />
          
          {selectedTrip.endLocation && (
            <View style={styles.locationBox}>
              <Text style={styles.locationIcon}>🏁</Text>
              <View>
                <Text style={styles.locationLabel}>END</Text>
                <Text style={styles.locationCoords}>
                  {selectedTrip.endLocation.latitude.toFixed(4)}°, {selectedTrip.endLocation.longitude.toFixed(4)}°
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(selectedTrip.distance / 1000).toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(selectedTrip.duration / 60)}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{selectedTrip.co2Saved?.toFixed(1) || '0'}</Text>
            <Text style={styles.statLabel}>kg CO₂</Text>
          </View>
        </View>
        
        {Platform.OS !== 'web' && (
          <Text style={styles.mapNote}>
            Map view available on mobile app
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  routeHeader: {
    padding: 10,
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  mapPlaceholder: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  transportModeText: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 20,
  },
  routeInfo: {
    width: '100%',
    marginBottom: 20,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationLabel: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
  },
  locationCoords: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  routeLine: {
    height: 20,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginLeft: 30,
    opacity: 0.5,
  },
  tripStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  mapNote: {
    fontSize: 10,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
});