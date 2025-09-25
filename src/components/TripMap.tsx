import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Trip, TransportMode } from '../types';

interface TripMapProps {
  selectedTrip: Trip;
  getPolylineColor: (mode: TransportMode) => string;
}

const NativeMap = Platform.OS !== 'web' ? React.lazy(() => 
  import('react-native-maps').then(module => ({
    default: (props: any) => {
      const MapView = module.default;
      const { Marker, Polyline } = module;
      const { selectedTrip, getPolylineColor } = props;
      
      return (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: selectedTrip.startLocation.latitude,
            longitude: selectedTrip.startLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker
            coordinate={{
              latitude: selectedTrip.startLocation.latitude,
              longitude: selectedTrip.startLocation.longitude,
            }}
            title="Start"
            pinColor="green"
          />
          
          {selectedTrip.endLocation && (
            <Marker
              coordinate={{
                latitude: selectedTrip.endLocation.latitude,
                longitude: selectedTrip.endLocation.longitude,
              }}
              title="End"
              pinColor="red"
            />
          )}

          <Polyline
            coordinates={selectedTrip.waypoints.map((point: any) => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor={getPolylineColor(selectedTrip.transportMode)}
            strokeWidth={4}
          />
        </MapView>
      );
    }
  }))
) : null;

export const TripMap: React.FC<TripMapProps> = ({ selectedTrip, getPolylineColor }) => {
  // Always show placeholder on web or if no trip
  if (Platform.OS === 'web' || !selectedTrip) {
    return (
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>🗺️</Text>
        <Text style={styles.mapPlaceholderSubtext}>Map View</Text>
        {selectedTrip && (
          <>
            <Text style={styles.mapInfo}>
              Start: {selectedTrip.startLocation.latitude.toFixed(4)}, {selectedTrip.startLocation.longitude.toFixed(4)}
            </Text>
            {selectedTrip.endLocation && (
              <Text style={styles.mapInfo}>
                End: {selectedTrip.endLocation.latitude.toFixed(4)}, {selectedTrip.endLocation.longitude.toFixed(4)}
              </Text>
            )}
            <Text style={styles.mapInfo}>
              Distance: {(selectedTrip.distance / 1000).toFixed(2)} km
            </Text>
          </>
        )}
      </View>
    );
  }

  // For native platforms, use the actual map
  if (NativeMap) {
    return (
      <React.Suspense fallback={
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>📍</Text>
          <Text style={styles.mapPlaceholderSubtext}>Loading Map...</Text>
        </View>
      }>
        <NativeMap selectedTrip={selectedTrip} getPolylineColor={getPolylineColor} />
      </React.Suspense>
    );
  }

  // Fallback
  return (
    <View style={styles.webMapPlaceholder}>
      <Text style={styles.mapPlaceholderText}>🗺️</Text>
      <Text style={styles.mapPlaceholderSubtext}>Map not available</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  webMapPlaceholder: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    height: 250,
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  mapPlaceholderSubtext: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  mapInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});