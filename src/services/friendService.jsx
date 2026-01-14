import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.jsx';

// Send friend request by email
export const sendFriendRequest = async (fromUserId, fromEmail, fromName, toEmail) => {
  try {
    console.log('Sending friend request from:', fromEmail, 'to:', toEmail);
    
    if (fromEmail.toLowerCase() === toEmail.toLowerCase()) {
      return { success: false, error: 'Cannot send friend request to yourself' };
    }
    
    let toUserId = null;
    let toUserName = '';
    
    // Search in focus collection for the user
    const focusRef = collection(db, 'focus');
    const focusSnapshot = await getDocs(focusRef);
    
    focusSnapshot.forEach((doc) => {
      if (doc.data().email === toEmail) {
        toUserId = doc.id;
        toUserName = doc.data().displayName || doc.data().email || 'User';
      }
    });
    
    if (!toUserId) {
      return { success: false, error: 'User not found with that email. They may not have used TimeBlock yet.' };
    }
    
    // Check if already friends
    try {
      const friendDoc = await getDoc(doc(db, `friends/${fromUserId}_${toUserId}`));
      if (friendDoc.exists()) {
        return { success: false, error: 'Already friends with this user' };
      }
      
      const friendDoc2 = await getDoc(doc(db, `friends/${toUserId}_${fromUserId}`));
      if (friendDoc2.exists()) {
        return { success: false, error: 'Already friends with this user' };
      }
    } catch (e) {
      console.log('No existing friendship found - good');
    }
    
    // Check if request already exists
    const requestsRef = collection(db, 'friendRequests');
    const existingQuery = query(
      requestsRef,
      where('from', '==', fromUserId),
      where('to', '==', toUserId),
      where('status', '==', 'pending')
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return { success: false, error: 'Friend request already sent' };
    }
    
    // Check reverse
    const reverseQuery = query(
      requestsRef,
      where('from', '==', toUserId),
      where('to', '==', fromUserId),
      where('status', '==', 'pending')
    );
    const reverseSnapshot = await getDocs(reverseQuery);
    
    if (!reverseSnapshot.empty) {
      return { success: false, error: 'This user already sent you a friend request!' };
    }
    
    // Create friend request
    await addDoc(requestsRef, {
      from: fromUserId,
      fromEmail: fromEmail,
      fromName: fromName,
      to: toUserId,
      toEmail: toEmail,
      toName: toUserName,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    console.log('Friend request sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error.message };
  }
};

// Get friend requests
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
    console.log('=== ACCEPTING FRIEND REQUEST ===');
    console.log('Request ID:', requestId);
    console.log('User ID:', userId);
    
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      console.error('Request document not found');
      return { success: false, error: 'Request not found' };
    }
    
    const requestData = requestDoc.data();
    console.log('Request data:', requestData);
    
    if (requestData.to !== userId) {
      console.error('User is not the receiver');
      return { success: false, error: 'Not authorized' };
    }
    
    // Create ONE friendship document (bidirectional info stored in it)
    const friendshipId1 = `${requestData.to}_${requestData.from}`;
    const friendshipId2 = `${requestData.from}_${requestData.to}`;
    
    console.log('Creating friendship documents:', friendshipId1, friendshipId2);
    
    try {
      // Store friendship from perspective of user 1
      await setDoc(doc(db, 'friends', friendshipId1), {
        user1: requestData.to,
        user2: requestData.from,
        user1Email: requestData.toEmail,
        user2Email: requestData.fromEmail,
        user1Name: requestData.toName,
        user2Name: requestData.fromName,
        createdAt: new Date().toISOString()
      });
      
      // Store friendship from perspective of user 2
      await setDoc(doc(db, 'friends', friendshipId2), {
        user1: requestData.from,
        user2: requestData.to,
        user1Email: requestData.fromEmail,
        user2Email: requestData.toEmail,
        user1Name: requestData.fromName,
        user2Name: requestData.toName,
        createdAt: new Date().toISOString()
      });
      
      console.log('Friendship created successfully!');
    } catch (createError) {
      console.error('Failed to create friendship:', createError);
      return { success: false, error: 'Failed to create friendship: ' + createError.message };
    }
    
    // Update request status
    try {
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });
      console.log('Request marked as accepted');
    } catch (updateError) {
      console.warn('Could not update request status:', updateError);
    }
    
    console.log('=== ACCEPT COMPLETE ===');
    return { success: true };
  } catch (error) {
    console.error('Error in acceptFriendRequest:', error);
    return { success: false, error: error.message };
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId, userId) => {
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      return { success: false, error: 'Request not found' };
    }
    
    const requestData = requestDoc.data();
    
    if (requestData.to !== userId) {
      return { success: false, error: 'Not authorized' };
    }
    
    await updateDoc(requestRef, {
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
    const friendsRef = collection(db, 'friends');
    const q = query(friendsRef, where('user1', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const friends = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      friends.push({
        id: doc.id,
        userId: data.user2,
        email: data.user2Email,
        displayName: data.user2Name,
        addedAt: data.createdAt
      });
    });
    
    console.log('Found', friends.length, 'friends');
    return { success: true, data: friends };
  } catch (error) {
    console.error('Error getting friends:', error);
    return { success: false, error: error.message };
  }
};

// Remove friend
export const removeFriend = async (userId, friendId) => {
  try {
    const id1 = `${userId}_${friendId}`;
    const id2 = `${friendId}_${userId}`;
    
    await deleteDoc(doc(db, 'friends', id1));
    await deleteDoc(doc(db, 'friends', id2));
    
    return { success: true };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, error: error.message };
  }
};