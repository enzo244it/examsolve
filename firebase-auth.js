// Firebase Authentication Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    OAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Make auth available globally
window.firebaseAuth = auth;
window.googleProvider = googleProvider;
window.appleProvider = appleProvider;

// Export functions for use in script.js
window.firebaseAuthFunctions = {
    signInWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            return {
                success: true,
                user: {
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    id: user.uid,
                    credits: 100,
                    picture: user.photoURL || ''
                }
            };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return {
                success: false,
                error: error.message || 'Failed to sign in with Google'
            };
        }
    },
    
    signInWithApple: async () => {
        try {
            const result = await signInWithPopup(auth, appleProvider);
            const user = result.user;
            return {
                success: true,
                user: {
                    name: user.displayName || user.email.split('@')[0] || 'Apple User',
                    email: user.email || '',
                    id: user.uid,
                    credits: 100,
                    picture: user.photoURL || ''
                }
            };
        } catch (error) {
            console.error('Apple sign-in error:', error);
            return {
                success: false,
                error: error.message || 'Failed to sign in with Apple'
            };
        }
    },
    
    signUpWithEmail: async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile with name if provided
            if (name && user.displayName !== name) {
                // Note: updateProfile requires firebase/auth module
                // For now, we'll store name in our custom user data
            }
            
            return {
                success: true,
                user: {
                    name: name || email.split('@')[0],
                    email: user.email,
                    id: user.uid,
                    credits: 100,
                    picture: ''
                }
            };
        } catch (error) {
            console.error('Email sign-up error:', error);
            let errorMessage = 'Failed to sign up';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            }
            return {
                success: false,
                error: errorMessage
            };
        }
    },
    
    signInWithEmail: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            return {
                success: true,
                user: {
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    id: user.uid,
                    credits: 100,
                    picture: user.photoURL || ''
                }
            };
        } catch (error) {
            console.error('Email sign-in error:', error);
            let errorMessage = 'Failed to sign in';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            }
            return {
                success: false,
                error: errorMessage
            };
        }
    },
    
    signOutUser: async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    onAuthStateChange: (callback) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                callback({
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    id: user.uid,
                    credits: 100,
                    picture: user.photoURL || ''
                });
            } else {
                callback(null);
            }
        });
    }
};

console.log('Firebase Auth initialized');

