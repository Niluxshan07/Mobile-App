# DefectTracker Mobile App

A React Native mobile application for the DefectTracker system, providing dashboard overview and user profile management.

## Features

### Authentication Screen
- Clean, responsive login interface
- Username/password authentication
- Remember me functionality
- Show/hide password toggle
- Demo credentials display
- Error handling with alerts

### Home Screen (Dashboard)
- Welcome message with user info
- Dashboard statistics overview:
  - Total Defects
  - Open Defects
  - Resolved Defects
  - Critical Defects
  - Pending Review
  - Assigned to Me
- Recent defects list with priority badges
- Quick action buttons
- Profile and logout navigation

### Profile Screen
- User avatar with initials
- Editable profile information
- User statistics display
- Account settings menu
- Edit/save profile functionality
- Sign out option

## App Structure

```
src/
├── screens/
│   ├── Authentication.tsx  # Login screen
│   ├── Home.tsx           # Dashboard screen
│   └── Profile.tsx        # User profile screen
└── App.tsx                # Main app with navigation logic
```

## Demo Credentials

- **Username:** admin
- **Password:** admin

Or any username with password "user"

## Navigation

The app uses a simple state-based navigation system:
- Authentication → Home (after successful login)
- Home → Profile (via profile button)
- Profile → Home (via back button)
- Any screen → Authentication (via logout)

## Styling

- Uses React Native StyleSheet for consistent styling
- Color scheme based on Tailwind CSS colors
- Responsive design with proper spacing
- Shadow effects and elevation for cards
- Clean text-based interface without symbols or emojis

## Mock Data

The app includes mock data for:
- Dashboard statistics
- Recent defects list
- User profile information
- User statistics

## Running the App

1. Make sure you have React Native development environment set up
2. Install dependencies: `npm install`
3. Start Metro bundler: `npm start`
4. Run on Android: `npm run android`
5. Run on iOS: `npm run ios`

## Key Components

### Authentication
- Form validation
- Loading states
- Error handling
- Keyboard-aware scrolling

### Home Dashboard
- Statistics cards with color coding
- Defect cards with priority indicators
- Quick action buttons
- Header with user info and navigation

### Profile Management
- Inline editing functionality
- User statistics display
- Settings menu items
- Profile picture with initials

## Future Enhancements

- Real API integration
- Push notifications
- Dark mode support
- Offline data caching
- Advanced filtering and search
- Real-time updates
