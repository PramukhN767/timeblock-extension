# TimeBlock - Focus Timer

A Chrome extension for time management using the Pomodoro technique. Track your productivity and compete with friends on a real-time leaderboard.

## Features

### Core Timer
- **Flexible Timer**: Choose from presets (25, 15, 5 min) or set custom durations (1-120 min)
- **Smart Persistence**: Timer continues running even if you close the popup or browser
- **Desktop Notifications**: Get notified when your focus session completes
- **Daily Stats**: Track your total focus time for today

### Social Features
- **Friend System**: Add friends by email and see their progress
- **Real-time Leaderboard**: Compete with friends based on total focus time
- **Friend Requests**: Send, accept, or reject friend requests
- **Live Updates**: Leaderboard updates automatically when you or friends complete sessions

### Authentication
- **Secure Sign In**: Email/password authentication via Firebase
- **Data Sync**: Your focus data syncs across devices
- **Privacy First**: Your data is private - only friends you add can see your stats

## Installation

### From Chrome Web Store (Recommended)
1. Visit [TimeBlock on Chrome Web Store](#) _(coming soon)_
2. Click "Add to Chrome"
3. Pin the extension to your toolbar

### Manual Installation (Development)
1. Download or clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode" (top right)
6. Click "Load unpacked" and select the `dist` folder

## How to Use

### Getting Started
1. Click the TimeBlock icon in your Chrome toolbar
2. Sign up with email and password
3. Start your first focus session!

### Using the Timer
- **Start**: Click "Start" to begin a focus session
- **Pause**: Click "Pause" to take a break
- **Reset**: Click "Reset" to return to the preset duration
- **Quick Set**: Use preset buttons (25, 15, 5 min) for common durations
- **Custom**: Enter any duration from 1-120 minutes

### Adding Friends
1. Click on the Friends section
2. Enter your friend's email (they must be registered)
3. They'll receive your request in their extension
4. Once accepted, you'll both appear on each other's leaderboard

### Viewing Your Stats
- **Today's Focus**: See total minutes focused today
- **Leaderboard**: Check your rank against friends
- **Total Minutes**: All-time focus time displayed on leaderboard

## Tech Stack

- **Frontend**: React 19, Vanilla CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Build**: Webpack 5, Babel
- **Chrome APIs**: Storage, Notifications, Alarms, Runtime

## Development

### Prerequisites
- Node.js 18+ and npm
- Chrome browser
- Firebase project (for auth & database)

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/timeblock.git
cd timeblock

# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes (development)
npm run watch
```

### Project Structure
```
timeblock/
├── src/
│   ├── popup/              # React popup UI
│   │   ├── components/     # React components
│   │   ├── styles.css      # Styling
│   │   └── index.jsx       # Main app
│   ├── services/           # Firebase services
│   │   ├── firebase.jsx    # Auth
│   │   ├── focusService.jsx
│   │   └── friendService.jsx
│   └── config/
│       └── firebase.jsx    # Firebase config
├── background/
│   └── background.js       # Service worker (timer logic)
├── assets/                 # Icons & sounds
├── manifest.json           # Extension manifest
├── popup.html              # Popup HTML
└── webpack.config.js       # Build config
```

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Add your config to `src/config/firebase.jsx`

### Firestore Collections
```
users/
  {userId}/
    - email
    - displayName
    - createdAt
    - friends/
        {friendId}/
          - userId
          - email
          - displayName
          - addedAt

focus/
  {userId}/
    - totalMinutes
    - displayName
    - email
    - updatedAt

friendRequests/
  {requestId}/
    - from (userId)
    - to (userId)
    - fromEmail
    - toEmail
    - fromName
    - toName
    - status (pending/accepted/rejected)
    - createdAt
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the Pomodoro Technique
- Built with React, Firebase, and Chrome Extensions API
- Icons designed with Figma

## Contact

Questions or feedback?

- GitHub: [@PramukhN767](https://github.com/PramukhN767)
- Email: zeusn2077@gmail.com

## Roadmap

Future features planned:

- [ ] Weekly and monthly statistics
- [ ] Dark/light theme toggle
- [ ] Export focus history as CSV
- [ ] Mobile companion app
- [ ] Custom notification sounds
- [ ] Achievement badges
- [ ] Focus session history

---

Made over 4 months of focused development.

Start building better focus habits today with TimeBlock.