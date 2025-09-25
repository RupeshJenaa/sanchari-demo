import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseInit';
import { useNavigation } from '@react-navigation/native';
import { User } from '../types';

export const ConsentScreen: React.FC = () => {
  const [accepted, setAccepted] = useState(false);
  const navigation = useNavigation<any>();

  const handleConsent = async () => {
    if (!accepted) {
      Alert.alert('Consent Required', 'Please accept the terms to continue using the app.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // Save user consent to Firestore
      const userData: Partial<User> = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        hasConsented: true,
        createdAt: new Date(),
        greenScore: 0,
        badges: [],
      };

      await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });
      
      // Navigation will be handled by auth state change
      // Just log success
      console.log('User consent saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Data Collection Consent</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Collect:</Text>
          <Text style={styles.bulletPoint}>• Location data during trips</Text>
          <Text style={styles.bulletPoint}>• Trip duration and distance</Text>
          <Text style={styles.bulletPoint}>• Transportation mode</Text>
          <Text style={styles.bulletPoint}>• Basic profile information</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Data:</Text>
          <Text style={styles.bulletPoint}>• Track your eco-friendly trips</Text>
          <Text style={styles.bulletPoint}>• Calculate CO₂ savings</Text>
          <Text style={styles.bulletPoint}>• Provide personalized insights</Text>
          <Text style={styles.bulletPoint}>• Award badges and points</Text>
          <Text style={styles.bulletPoint}>• Improve transportation planning</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security:</Text>
          <Text style={styles.bulletPoint}>• Your data is encrypted and secure</Text>
          <Text style={styles.bulletPoint}>• We never share personal information</Text>
          <Text style={styles.bulletPoint}>• You can delete your data anytime</Text>
          <Text style={styles.bulletPoint}>• Location tracking only during trips</Text>
        </View>

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand and agree to the data collection terms
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !accepted && styles.buttonDisabled]}
          onPress={handleConsent}
          disabled={!accepted}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    marginVertical: 3,
    paddingLeft: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2e7d32',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});