import { doc, getDoc, setDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase.jsx';

// Get user's focus data
export const getUserFocus = async (userId) => {
  try {
    const focusDoc = await getDoc(doc(db, 'focus', userId));
    
    if (focusDoc.exists()) {
      return { success: true, data: focusDoc.data() };
    } else {
      // Initialize focus data for new user
      const initialData = {
        totalMinutes: 0,
        displayName: 'User',
        email: '',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'focus', userId), initialData);
      return { success: true, data: initialData };
    }
  } catch (error) {
    console.error('Error getting focus data:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard (top users by total focus time)
export const getLeaderboard = async (limitCount = 10) => {
  try {
    const leaderboardQuery = query(
      collection(db, 'focus'),
      orderBy('totalMinutes', 'desc'),
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
export const getUserRank = async (userId, totalMinutes) => {
  try {
    const higherFocusQuery = query(
      collection(db, 'focus'),
      orderBy('totalMinutes', 'desc')
    );
    
    const querySnapshot = await getDocs(higherFocusQuery);
    let rank = 1;
    
    querySnapshot.forEach((doc) => {
      if (doc.data().totalMinutes > totalMinutes) {
        rank++;
      }
    });
    
    return { success: true, rank };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { success: false, error: error.message };
  }
};

// Update focus time when user completes a timer
export const updateFocusTime = async (userId, minutesCompleted, userDisplayName = 'User', userEmail = '') => {
  try {
    const focusResult = await getUserFocus(userId);
    
    if (!focusResult.success) {
      return focusResult;
    }
    
    const focusData = focusResult.data;
    
    const updates = {
      totalMinutes: increment(minutesCompleted),
      updatedAt: new Date().toISOString(),
      displayName: userDisplayName || focusData.displayName || 'User',
      email: userEmail || focusData.email || ''
    };
    
    await updateDoc(doc(db, 'focus', userId), updates);
    
    const updatedData = {
      ...focusData,
      totalMinutes: focusData.totalMinutes + minutesCompleted,
      ...updates
    };
    
    console.log('Focus time updated:', updatedData);
    return { success: true, data: updatedData };
    
  } catch (error) {
    console.error('Error updating focus time:', error);
    return { success: false, error: error.message };
  }
};