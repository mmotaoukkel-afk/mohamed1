import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc,
    increment,
    getDoc,
    setDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Social Service - Handle Public Reviews & Product Likes
 */
const socialService = {
    // --- COMMENTS / REVIEWS ---

    /**
     * Post a public review for a product
     */
    async addComment(productId, user, text, rating, images = []) {
        try {
            if (!text || text.trim() === '') return;

            // Upload images first if any
            const imageUrls = [];
            if (images && images.length > 0) {
                for (const imageUri of images) {
                    const downloadUrl = await this.uploadReviewImage(productId, imageUri);
                    if (downloadUrl) imageUrls.push(downloadUrl);
                }
            }

            const commentData = {
                productId: productId.toString(),
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
                userPhoto: user.photoURL || null,
                text: text.trim(),
                images: imageUrls,
                rating: rating || 5,
                createdAt: serverTimestamp(),
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
        const q = query(
            collection(db, 'comments'),
            where('productId', '==', productId.toString()),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
            callback(comments);
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

    /**
     * Upload an image to Firebase Storage for a review
     */
    async uploadReviewImage(productId, uri) {
        try {
            const filename = uri.substring(uri.lastIndexOf('/') + 1);
            const extension = filename.split('.').pop();
            const storagePath = `reviews/${productId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
            const storageRef = ref(storage, storagePath);

            const response = await fetch(uri);
            const blob = await response.blob();

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading review image:', error);
            return null;
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
