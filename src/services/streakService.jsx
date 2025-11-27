import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase.jsx';

// Get user's streak data
export const getUserStreak = async (userId) => {
  try {
    const streakDoc = await getDoc(doc(db, 'streaks', userId));
    
    if (streakDoc.exists()) {
      return { success: true, data: streakDoc.data() };
    } else {
      // Initialize streak data for new user
      const initialData = {
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        lastActiveDate: null,
        createdAt: new Date().toISOString(),
        // Add placeholder for user info (will be updated on first streak update)
        displayName: 'User',
        email: ''
      };
      
      await setDoc(doc(db, 'streaks', userId), initialData);
      return { success: true, data: initialData };
    }
  } catch (error) {
    console.error('Error getting streak:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard (top users by current streak)
export const getLeaderboard = async (limitCount = 10) => {
  try {
    const leaderboardQuery = query(
      collection(db, 'streaks'),
      orderBy('currentStreak', 'desc'),
      orderBy('longestStreak', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      leaderboard.push({
        userId: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Get user's rank in leaderboard
export const getUserRank = async (userId, currentStreak) => {
  try {
    // Query all users with streak higher than current user
    const higherStreaksQuery = query(
      collection(db, 'streaks'),
      orderBy('currentStreak', 'desc')
    );
    
    const querySnapshot = await getDocs(higherStreaksQuery);
    let rank = 1;
    
    querySnapshot.forEach((doc) => {
      if (doc.data().currentStreak > currentStreak) {
        rank++;
      }
    });
    
    return { success: true, rank };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { success: false, error: error.message };
  }
};

// Calculate if dates are consecutive
const isConsecutiveDays = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 1;
};

// Check if date is today
const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

// Update streak when user completes a timer
export const updateStreak = async (userId, userDisplayName = 'User', userEmail = '') => {
  try {
    const streakResult = await getUserStreak(userId);
    
    if (!streakResult.success) {
      return streakResult;
    }
    
    const streakData = streakResult.data;
    const today = new Date().toISOString();
    
    if (streakData.lastActiveDate && isToday(streakData.lastActiveDate)) {
      console.log('Streak already updated today');
      return { success: true, data: streakData };
    }
    
    let newCurrentStreak = streakData.currentStreak;
    let newLongestStreak = streakData.longestStreak;
    
    if (!streakData.lastActiveDate) {
      newCurrentStreak = 1;
    } else if (isConsecutiveDays(streakData.lastActiveDate, today)) {
      newCurrentStreak = streakData.currentStreak + 1;
    } else if (!isToday(streakData.lastActiveDate)) {
      newCurrentStreak = 1;
    }
    
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }
    
    const updates = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalDays: increment(1),
      lastActiveDate: today,
      updatedAt: today,
      // Update display info for leaderboard
      displayName: userDisplayName || streakData.displayName || 'User',
      email: userEmail || streakData.email || ''
    };
    
    await updateDoc(doc(db, 'streaks', userId), updates);
    
    const updatedData = {
      ...streakData,
      ...updates,
      totalDays: streakData.totalDays + 1
    };
    
    console.log('Streak updated:', updatedData);
    return { success: true, data: updatedData };
    
  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, error: error.message };
  }
};

// Reset streak
export const resetStreak = async (userId) => {
  try {
    const updates = {
      currentStreak: 0,
      lastActiveDate: null,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'streaks', userId), updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};