import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    increment,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Social Service - Handle Public Reviews & Product Likes
 */
const socialService = {
    // --- COMMENTS / REVIEWS ---

    /**
     * Post a public review for a product
     */
    async addComment(productId, user, text, rating) {
        try {
            if (!text || text.trim() === '') return;

            const commentData = {
                productId: productId.toString(),
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
                userPhoto: user.photoURL || null,
                text: text.trim(),
                rating: rating || 5,
                timestamp: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'comments'), commentData);
            return docRef.id;
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    },

    /**
     * Real-time listener for comments on a product
     */
    subscribeToComments(productId, callback) {
        // Removed orderBy to avoid index requirement (temporary fix)
        // Will sort client-side instead
        const q = query(
            collection(db, 'comments'),
            where('productId', '==', productId.toString())
        );

        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));

            // Sort client-side by timestamp descending
            comments.sort((a, b) => {
                const timeA = a.timestamp?.getTime ? a.timestamp.getTime() : 0;
                const timeB = b.timestamp?.getTime ? b.timestamp.getTime() : 0;
                return timeB - timeA;
            });

            callback(comments);
        }, (error) => {
            // Handle errors gracefully
            console.error('Error subscribing to comments:', error);
            callback([]); // Return empty array on error
        });
    },

    /**
     * Delete a comment (Admin or Owner only logic)
     */
    async deleteComment(commentId) {
        try {
            await deleteDoc(doc(db, 'comments', commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    },

    // --- PUBLIC LIKES ---

    /**
     * Toggle a public like for a product
     */
    async togglePublicLike(productId, userId, isAdding) {
        try {
            const productRef = doc(db, 'productStats', productId.toString());
            const userLikeRef = doc(db, 'userLikes', `${userId}_${productId}`);

            if (isAdding) {
                // Increment global count
                await setDoc(productRef, { likes: increment(1) }, { merge: true });
                // Record user like
                await setDoc(userLikeRef, { userId, productId: productId.toString(), likedAt: serverTimestamp() });
            } else {
                // Decrement global count
                await setDoc(productRef, { likes: increment(-1) }, { merge: true });
                // Remove user like record
                await deleteDoc(userLikeRef);
            }
        } catch (error) {
            console.error('Error toggling public like:', error);
            throw error;
        }
    },

    /**
     * Get public likes count for a product
     */
    subscribeToProductStats(productId, callback) {
        return onSnapshot(doc(db, 'productStats', productId.toString()), (doc) => {
            if (doc.exists()) {
                callback(doc.data().likes || 0);
            } else {
                callback(0);
            }
        });
    }
};

export default socialService;
