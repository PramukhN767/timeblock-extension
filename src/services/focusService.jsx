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
    console.log('Fetching leaderboard...');
    
    const leaderboardQuery = query(
      collection(db, 'focus'),
      orderBy('totalMinutes', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Leaderboard entry:', { userId: doc.id, ...data });
      
      leaderboard.push({
        userId: doc.id,
        ...data
      });
    });
    
    console.log('Leaderboard fetched:', leaderboard.length, 'entries');
    return { success: true, data: leaderboard };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: error.message };
  }
};

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
    console.log('Starting updateFocusTime:', { userId, minutesCompleted, userDisplayName, userEmail });
    
    const focusRef = doc(db, 'focus', userId);
    const focusDoc = await getDoc(focusRef);
    
    if (focusDoc.exists()) {
      // Document exists - get current total and add manually
      const currentData = focusDoc.data();
      const currentTotal = parseInt(currentData.totalMinutes) || 0;
      const newTotal = currentTotal + parseInt(minutesCompleted);
      
      console.log('Updating: current =', currentTotal, '+ adding =', minutesCompleted, '= new total =', newTotal);
      
      await updateDoc(focusRef, {
        totalMinutes: newTotal,
        displayName: userDisplayName,
        email: userEmail,
        updatedAt: new Date().toISOString()
      });
      
      // Get updated data
      const updatedDoc = await getDoc(focusRef);
      const updatedData = updatedDoc.data();
      
      console.log('Focus updated! New total:', updatedData.totalMinutes);
      return { success: true, data: updatedData };
      
    } else {
      // Document doesn't exist - create it
      console.log('Creating new document');
      
      const newData = {
        totalMinutes: parseInt(minutesCompleted),
        displayName: userDisplayName,
        email: userEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(focusRef, newData);
      
      console.log('Focus document created!');
      return { success: true, data: newData };
    }
    
  } catch (error) {
    console.error('Error updating focus time:', error);
    return { success: false, error: error.message };
  }
};