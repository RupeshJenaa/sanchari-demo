import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebaseInit';
import { User, Badge, Trip } from '../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Badge definitions
const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first_trip',
    name: 'First Steps',
    description: 'Complete your first trip',
    icon: '🎯',
    condition: { type: 'trips', value: 1 },
    points: 10,
  },
  {
    id: 'walker_5km',
    name: 'Walker',
    description: 'Walk 5 kilometers',
    icon: '🚶',
    condition: { type: 'distance', value: 5000, transportMode: 'walking' as any },
    points: 20,
  },
  {
    id: 'cyclist_10km',
    name: 'Cyclist',
    description: 'Cycle 10 kilometers',
    icon: '🚴',
    condition: { type: 'distance', value: 10000, transportMode: 'cycling' as any },
    points: 30,
  },
  {
    id: 'co2_warrior',
    name: 'CO₂ Warrior',
    description: 'Save 10 kg of CO₂',
    icon: '🌱',
    condition: { type: 'co2_saved', value: 10 },
    points: 50,
  },
  {
    id: 'trip_master',
    name: 'Trip Master',
    description: 'Complete 10 trips',
    icon: '🏆',
    condition: { type: 'trips', value: 10 },
    points: 40,
  },
  {
    id: 'eco_champion',
    name: 'Eco Champion',
    description: 'Save 50 kg of CO₂',
    icon: '🌍',
    condition: { type: 'co2_saved', value: 50 },
    points: 100,
  },
];

export const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tripStats, setTripStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalCO2: 0,
    walkingDistance: 0,
    cyclingDistance: 0,
  });
  const navigation = useNavigation<any>();

  // Refresh data whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      calculateBadges();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() as User : null;

      if (userData) {
        setUser(userData);
      } else {
        // Create minimal user profile if doesn't exist
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || '',
          greenScore: 0,
          badges: [],
          hasConsented: true,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBadges = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Fetch all user trips
      const tripsRef = collection(db, 'trips');
      const q = query(tripsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      let stats = {
        totalTrips: 0,
        totalDistance: 0,
        totalCO2: 0,
        walkingDistance: 0,
        cyclingDistance: 0,
      };

      querySnapshot.forEach((doc) => {
        const trip = doc.data() as Trip;
        stats.totalTrips++;
        stats.totalDistance += trip.distance || 0;
        stats.totalCO2 += trip.co2Saved || 0;
        
        if (trip.transportMode === 'walking') {
          stats.walkingDistance += trip.distance || 0;
        } else if (trip.transportMode === 'cycling') {
          stats.cyclingDistance += trip.distance || 0;
        }
      });

      setTripStats(stats);

      // Check which badges are earned
      const earnedBadges: Badge[] = [];
      
      BADGE_DEFINITIONS.forEach((badge) => {
        let earned = false;
        
        switch (badge.condition.type) {
          case 'trips':
            earned = stats.totalTrips >= badge.condition.value;
            break;
          case 'distance':
            if (badge.condition.transportMode === 'walking') {
              earned = stats.walkingDistance >= badge.condition.value;
            } else if (badge.condition.transportMode === 'cycling') {
              earned = stats.cyclingDistance >= badge.condition.value;
            } else {
              earned = stats.totalDistance >= badge.condition.value;
            }
            break;
          case 'co2_saved':
            earned = stats.totalCO2 >= badge.condition.value;
            break;
        }
        
        if (earned) {
          earnedBadges.push({ ...badge, unlockedAt: new Date() });
        }
      });

      setBadges(earnedBadges);
    } catch (error) {
      console.error('Error calculating badges:', error);
    }
  };

  const calculateGreenScore = () => {
    // Green Score Formula:
    // - 1 point per km traveled eco-friendly (walking/cycling)
    // - 5 points per kg CO2 saved
    // - Badge points
    const ecoDistance = (tripStats.walkingDistance + tripStats.cyclingDistance) / 1000;
    const co2Points = tripStats.totalCO2 * 5;
    const badgePoints = badges.reduce((sum, badge) => sum + badge.points, 0);
    
    return Math.round(ecoDistance + co2Points + badgePoints);
  };

  const handleSignOut = async () => {
    // For web, use confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmSignOut = window.confirm('Are you sure you want to sign out?');
      if (confirmSignOut) {
        try {
          await signOut(auth);
          // Force reload on web to reset the app state
          window.location.reload();
        } catch (error: any) {
          alert('Error signing out: ' + error.message);
        }
      }
    } else {
      // Mobile platforms use Alert.alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut(auth);
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const greenScore = calculateGreenScore();
  const getScoreLevel = () => {
    if (greenScore < 50) return 'Beginner';
    if (greenScore < 200) return 'Eco Warrior';
    if (greenScore < 500) return 'Green Champion';
    return 'Earth Hero';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || '👤'}</Text>
        </View>
        <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'Eco Traveler'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Green Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Green Score</Text>
        <Text style={styles.scoreValue}>{greenScore}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{getScoreLevel()}</Text>
        </View>
        <View style={styles.scoreBreakdown}>
          <Text style={styles.breakdownText}>
            🚶 {(tripStats.walkingDistance / 1000).toFixed(1)} km walked
          </Text>
          <Text style={styles.breakdownText}>
            🚴 {(tripStats.cyclingDistance / 1000).toFixed(1)} km cycled
          </Text>
          <Text style={styles.breakdownText}>
            🌱 {tripStats.totalCO2.toFixed(1)} kg CO₂ saved
          </Text>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <Text style={styles.sectionTitle}>Achievements ({badges.length}/{BADGE_DEFINITIONS.length})</Text>
        <View style={styles.badgeGrid}>
          {BADGE_DEFINITIONS.map((badge) => {
            const isEarned = badges.some(b => b.id === badge.id);
            return (
              <TouchableOpacity
                key={badge.id}
                style={[styles.badgeCard, !isEarned && styles.badgeLocked]}
                onPress={() => {
                  Alert.alert(
                    badge.name,
                    `${badge.description}\n\nPoints: ${badge.points}\nStatus: ${isEarned ? 'Earned ✅' : 'Locked 🔒'}`
                  );
                }}
              >
                <Text style={[styles.badgeIcon, !isEarned && styles.badgeIconLocked]}>
                  {isEarned ? badge.icon : '🔒'}
                </Text>
                <Text style={[styles.badgeName, !isEarned && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                {isEarned && (
                  <View style={styles.badgePoints}>
                    <Text style={styles.badgePointsText}>+{badge.points}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Journey Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tripStats.totalTrips}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{(tripStats.totalDistance / 1000).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Km Traveled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tripStats.totalCO2.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Kg CO₂ Saved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{badges.length}</Text>
            <Text style={styles.statLabel}>Badges Earned</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
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
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  scoreCard: {
    backgroundColor: '#2e7d32',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  scoreTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 15,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scoreBreakdown: {
    width: '100%',
  },
  breakdownText: {
    color: '#fff',
    fontSize: 12,
    marginVertical: 2,
    opacity: 0.9,
  },
  badgesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 15,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '30%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeLocked: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 11,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgePoints: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgePointsText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
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
  signOutButton: {
    backgroundColor: '#ff5252',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});