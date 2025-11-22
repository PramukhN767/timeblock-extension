import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

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
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'streaks', userId), initialData);
      return { success: true, data: initialData };
    }
  } catch (error) {
    console.error('Error getting streak:', error);
    return { success: false, error: error.message };
  }
};

// Calculate if dates are consecutive
const isConsecutiveDays = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Reset time to start of day for accurate comparison
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
export const updateStreak = async (userId) => {
  try {
    const streakResult = await getUserStreak(userId);
    
    if (!streakResult.success) {
      return streakResult;
    }
    
    const streakData = streakResult.data;
    const today = new Date().toISOString();
    
    // If already updated today, don't update again
    if (streakData.lastActiveDate && isToday(streakData.lastActiveDate)) {
      console.log('Streak already updated today');
      return { success: true, data: streakData };
    }
    
    let newCurrentStreak = streakData.currentStreak;
    let newLongestStreak = streakData.longestStreak;
    
    // Calculate new streak
    if (!streakData.lastActiveDate) {
      // First time user
      newCurrentStreak = 1;
    } else if (isConsecutiveDays(streakData.lastActiveDate, today)) {
      // Consecutive day - increment streak
      newCurrentStreak = streakData.currentStreak + 1;
    } else if (!isToday(streakData.lastActiveDate)) {
      // Missed day(s) - reset streak
      newCurrentStreak = 1;
    }
    
    // Update longest streak if current is higher
    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }
    
    // Update Firestore
    const updates = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalDays: increment(1),
      lastActiveDate: today,
      updatedAt: today
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

// Reset streak (for testing or user request)
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