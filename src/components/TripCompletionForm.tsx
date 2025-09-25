import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

interface TripCompletionFormProps {
  visible: boolean;
  onComplete: (purpose: string, companions: number) => void;
  onCancel: () => void;
  tripDistance: number; // in km
  tripDuration: number; // in seconds
}

const TRIP_PURPOSES = [
  'Work',
  'Shopping',
  'Education',
  'Healthcare',
  'Recreation',
  'Social Visit',
  'Business',
  'Tourism',
  'Other'
];

export const TripCompletionForm: React.FC<TripCompletionFormProps> = ({
  visible,
  onComplete,
  onCancel,
  tripDistance,
  tripDuration,
}) => {
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [companions, setCompanions] = useState('0');

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSubmit = () => {
    const purpose = selectedPurpose === 'Other' ? customPurpose : selectedPurpose;
    const companionCount = parseInt(companions, 10);

    if (!purpose.trim()) {
      Alert.alert('Required Field', 'Please select or enter a trip purpose.');
      return;
    }

    if (isNaN(companionCount) || companionCount < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of companions (0 or more).');
      return;
    }

    onComplete(purpose.trim(), companionCount);
    
    // Reset form
    setSelectedPurpose('');
    setCustomPurpose('');
    setCompanions('0');
  };

  const handleCancel = () => {
    onCancel();
    // Reset form
    setSelectedPurpose('');
    setCustomPurpose('');
    setCompanions('0');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Trip Completed!</Text>
            
            {/* Trip Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Trip Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Distance:</Text>
                <Text style={styles.summaryValue}>{tripDistance.toFixed(2)} km</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{formatDuration(tripDuration)}</Text>
              </View>
            </View>

            {/* Trip Purpose Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What was the purpose of your trip?</Text>
              <View style={styles.purposeGrid}>
                {TRIP_PURPOSES.map((purpose) => (
                  <TouchableOpacity
                    key={purpose}
                    style={[
                      styles.purposeButton,
                      selectedPurpose === purpose && styles.selectedPurpose,
                    ]}
                    onPress={() => setSelectedPurpose(purpose)}
                  >
                    <Text
                      style={[
                        styles.purposeText,
                        selectedPurpose === purpose && styles.selectedPurposeText,
                      ]}
                    >
                      {purpose}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {selectedPurpose === 'Other' && (
                <TextInput
                  style={styles.customInput}
                  placeholder="Please specify..."
                  value={customPurpose}
                  onChangeText={setCustomPurpose}
                  maxLength={50}
                />
              )}
            </View>

            {/* Companions Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How many companions traveled with you?</Text>
              <View style={styles.companionsContainer}>
                {[0, 1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.companionButton,
                      companions === num.toString() && styles.selectedCompanion,
                    ]}
                    onPress={() => setCompanions(num.toString())}
                  >
                    <Text
                      style={[
                        styles.companionText,
                        companions === num.toString() && styles.selectedCompanionText,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[
                    styles.companionInput,
                    ![0, 1, 2, 3, 4].some(n => n.toString() === companions) && styles.customCompanionInput,
                  ]}
                  placeholder="5+"
                  value={![0, 1, 2, 3, 4].some(n => n.toString() === companions) ? companions : ''}
                  onChangeText={setCompanions}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  purposeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedPurpose: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  purposeText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPurposeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginTop: 10,
  },
  companionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  companionButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedCompanion: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  companionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  selectedCompanionText: {
    color: '#fff',
  },
  companionInput: {
    width: 50,
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 22.5,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#f5f5f5',
  },
  customCompanionInput: {
    backgroundColor: '#fff',
    borderColor: '#2e7d32',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#2e7d32',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});