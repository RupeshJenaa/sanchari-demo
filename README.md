# Project Yatra - SIH Demo 🌱

An eco-friendly trip tracking app that rewards sustainable transportation choices with gamification features.

## 🚀 Features Implemented

### ✅ User Onboarding & Consent
- Firebase Authentication (Email/Phone login)
- Data collection consent screen
- User profile management

### ✅ Trip Tracking
- Background location tracking using expo-location
- Automatic transport mode detection (Walking, Cycling, Car, Public Transport)
- Real-time distance and duration calculation
- Trip data saved to Firestore

### ✅ Yatra Assistant (Chatbot-lite)
- Push notifications after each trip for validation
- Yes/No response tracking
- Bonus points for validated trips

### ✅ Personal Trip Diary
- Interactive map view showing trip routes with polylines
- Trip statistics dashboard
- Total distance, CO₂ saved, and points earned
- Trip history with detailed metrics

### ✅ Gamification (WOW Feature)
- Green Score calculation based on eco-friendly travel
- Achievement badges system
- 6 unlockable badges for different milestones
- User levels: Beginner → Eco Warrior → Green Champion → Earth Hero
- Points system based on transport mode

## 📱 Quick Demo Setup

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS/Android)

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Add a Web app to your project
   - Copy the configuration and update `src/services/firebase.config.ts`
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Set Firestore rules to allow authenticated read/write

3. **Start the Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on Your Device**
   - Scan the QR code with Expo Go app (Android)
   - Scan the QR code with Camera app (iOS)

## 🌐 Deployment Options

### Option 1: Expo Go (Quickest for Demo)
```bash
# Start the server
npm start

# Share the QR code with judges
# They can test using Expo Go app
```

### Option 2: Web Preview
```bash
# Run on web (limited features)
npm run web
```

### Option 3: Build APK (Android)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build APK
eas build --platform android --profile preview

# Download APK from the provided link
```

### Option 4: Expo Publish (Online Access)
```bash
# Publish to Expo servers
expo publish

# Share the link: exp://exp.host/@your-username/project-sanchari-sih-demo
```

## 🔧 Environment Setup

Create a `.env` file (optional for local config):
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
```

## 📊 Tech Stack

- **Frontend**: React Native + Expo
- **Navigation**: React Navigation
- **Backend**: Firebase (Auth + Firestore)
- **Maps**: React Native Maps
- **Location**: Expo Location + Task Manager
- **Notifications**: Expo Notifications
- **State**: React Hooks
- **Language**: TypeScript

## 🎮 How to Use the App

1. **Sign Up/Login**: Create an account or login
2. **Grant Permissions**: Accept data collection terms
3. **Start Tracking**: Tap "Start Tracking" before your trip
4. **Travel**: Walk, cycle, or use public transport
5. **Stop Tracking**: End your trip to see stats
6. **Validate**: Respond to notification asking if trip was accurate
7. **View Progress**: Check your Green Score and badges in Profile
8. **Trip History**: See all your trips on the map in Diary

## 🏆 Scoring System

- **Walking**: 10 points/km + 100% CO₂ savings
- **Cycling**: 8 points/km + 100% CO₂ savings  
- **Public Transport**: 5 points/km + 48% CO₂ savings
- **Car**: 1 point/km + 0% CO₂ savings

## 📈 CO₂ Calculation

Based on average emissions:
- Car: 171g CO₂/km
- Bus: 89g CO₂/km
- Walking/Cycling: 0g CO₂/km

## 🐛 Troubleshooting

1. **Location not tracking**: 
   - Ensure location permissions are granted
   - Check if location services are enabled

2. **Notifications not showing**:
   - Grant notification permissions
   - Check device notification settings

3. **Map not loading**:
   - Ensure Google Maps API is configured (for Android)
   - Check internet connection

## 👥 Team

Project Yatra - Built for Smart India Hackathon Demo

## 📝 License

MIT License - Feel free to use for educational purposes

---

**Ready for SIH Demo! 🚀**

For quick demo during judging:
1. Open Expo Go on judge's device
2. Scan QR code from `npm start`
3. Login with demo account: `demo@yatra.com` / `demo123`
4. Show trip tracking and gamification features