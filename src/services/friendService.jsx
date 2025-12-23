import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.jsx';

// Send friend request by email
export const sendFriendRequest = async (fromUserId, fromEmail, fromName, toEmail) => {
  try {
    // Find user by email in streaks collection (since that's where we have user data)
    const streaksRef = collection(db, 'streaks');
    const allStreaks = await getDocs(streaksRef);
    
    let toUserId = null;
    let toUserData = null;
    
    // Search through all streak documents to find matching email
    allStreaks.forEach((doc) => {
      if (doc.data().email === toEmail) {
        toUserId = doc.id;
        toUserData = doc.data();
      }
    });
    
    if (!toUserId) {
      return { success: false, error: 'User not found with that email' };
    }
    
    if (toUserId === fromUserId) {
      return { success: false, error: 'Cannot send friend request to yourself' };
    }
    
    // Check if already friends
    const friendDoc = await getDoc(doc(db, `users/${fromUserId}/friends/${toUserId}`));
    if (friendDoc.exists()) {
      return { success: false, error: 'Already friends with this user' };
    }
    
    // Check if request already exists
    const requestsRef = collection(db, 'friendRequests');
    const existingRequest = query(
      requestsRef,
      where('from', '==', fromUserId),
      where('to', '==', toUserId),
      where('status', '==', 'pending')
    );
    const existingSnapshot = await getDocs(existingRequest);
    
    if (!existingSnapshot.empty) {
      return { success: false, error: 'Friend request already sent' };
    }
    
    // Create friend request
    await addDoc(collection(db, 'friendRequests'), {
      from: fromUserId,
      fromEmail: fromEmail,
      fromName: fromName,
      to: toUserId,
      toEmail: toEmail,
      toName: toUserData?.displayName || 'User',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};

// Get friend requests for a user
export const getFriendRequests = async (userId) => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('to', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: requests };
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return { success: false, error: error.message };
  }
};

// Accept friend request
export const acceptFriendRequest = async (requestId, userId) => {
  try {
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    
    if (!requestDoc.exists()) {
      return { success: false, error: 'Request not found' };
    }
    
    const requestData = requestDoc.data();
    
    // Add to both users' friends list
    await setDoc(doc(db, `users/${requestData.to}/friends/${requestData.from}`), {
      userId: requestData.from,
      email: requestData.fromEmail,
      displayName: requestData.fromName,
      addedAt: new Date().toISOString()
    });
    
    await setDoc(doc(db, `users/${requestData.from}/friends/${requestData.to}`), {
      userId: requestData.to,
      email: requestData.toEmail,
      displayName: requestData.toName,
      addedAt: new Date().toISOString()
    });
    
    // Update request status
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return { success: false, error: error.message };
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return { success: false, error: error.message };
  }
};

// Get user's friends
export const getFriends = async (userId) => {
  try {
    const friendsRef = collection(db, `users/${userId}/friends`);
    const querySnapshot = await getDocs(friendsRef);
    
    const friends = [];
    querySnapshot.forEach((doc) => {
      friends.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: friends };
  } catch (error) {
    console.error('Error getting friends:', error);
    return { success: false, error: error.message };
  }
};