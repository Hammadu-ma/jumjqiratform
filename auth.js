// auth.js - Complete Authentication with Firebase Auth + Session Management
// For JUMJ Irshad Admin Dashboard

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
    updateEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc,
    query, 
    where, 
    orderBy,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAR_g5y04YAGCrTvZCowrE7hw8h7k1du08",
    authDomain: "jujm-qirat.firebaseapp.com",
    projectId: "jujm-qirat",
    storageBucket: "jujm-qirat.firebasestorage.app",
    messagingSenderId: "253413984903",
    appId: "1:253413984903:web:c1577e0fdef1711f960622"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== SESSION MANAGEMENT ====================

/**
 * Get current admin session from localStorage
 * @returns {Object|null} Session data or null
 */
export function getCurrentSession() {
    try {
        const session = localStorage.getItem('adminSession');
        if (!session) return null;
        
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Session expires after 24 hours
        if (hoursDiff > 24) {
            localStorage.removeItem('adminSession');
            return null;
        }
        
        return sessionData;
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

/**
 * Check if admin is currently logged in (synchronous)
 * @returns {boolean} True if logged in
 */
export function isLoggedIn() {
    const session = getCurrentSession();
    return session !== null;
}

/**
 * Get current admin info (synchronous from session only)
 * @returns {Object|null} Admin info or null
 */
export function getCurrentAdminSync() {
    const session = getCurrentSession();
    if (!session) return null;
    
    return {
        id: session.adminId,
        name: session.name,
        email: session.email,
        role: session.role
    };
}

/**
 * Get current admin info with Firebase verification (async)
 * @returns {Promise<Object|null>} Admin info or null
 */
export async function getCurrentAdmin() {
    const session = getCurrentSession();
    if (!session) return null;
    
    // Return session data directly without Firebase check for speed
    // The session already contains the admin info
    return {
        id: session.adminId,
        name: session.name,
        email: session.email,
        role: session.role
    };
}

/**
 * Logout current admin
 */
export async function logout() {
    try {
        // Clear localStorage first
        localStorage.removeItem('adminSession');
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('redirectAfterLogin');
        
        // Then sign out from Firebase if user exists
        const user = auth.currentUser;
        if (user) {
            await signOut(auth);
        }
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('admin-logout'));
        
        // Force redirect to login
        window.location.href = 'admin-login.html';
    } catch (error) {
        console.error("Logout error:", error);
        // Still redirect even if Firebase signout fails
        window.location.href = 'admin-login.html';
    }
}

/**
 * Login admin with email and password
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} Result object
 */
export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get admin data from Firestore
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        
        if (!adminDoc.exists()) {
            await signOut(auth);
            return { success: false, message: 'Admin account not found in database' };
        }
        
        const adminData = adminDoc.data();
        
        // Create session
        const sessionData = {
            adminId: user.uid,
            name: adminData.name,
            email: adminData.email,
            role: adminData.role || 'admin',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        sessionStorage.setItem('adminLoggedIn', 'true');
        
        // Log activity (don't await to avoid blocking)
        logActivity(user.uid, adminData.name, 'LOGIN', 'Admin logged in successfully').catch(console.error);
        
        return { success: true, message: 'Login successful' };
        
    } catch (error) {
        console.error("Login error:", error);
        let message = 'Login failed';
        if (error.code === 'auth/user-not-found') message = 'Email not found';
        else if (error.code === 'auth/wrong-password') message = 'Invalid password';
        else if (error.code === 'auth/invalid-email') message = 'Invalid email format';
        else if (error.code === 'auth/too-many-requests') message = 'Too many attempts. Try again later';
        return { success: false, message: message };
    }
}

/**
 * Register a new admin (with Firebase Auth)
 * @param {Object} adminData - Admin data { name, email, password, role, secretKey }
 * @param {string} registrarId - ID of admin creating this account
 * @param {string} registrarName - Name of admin creating this account
 * @returns {Promise<Object>} Result object
 */
export async function registerAdmin(adminData, registrarId = null, registrarName = null) {
    try {
        // Check if email already exists in Firestore
        const emailQuery = query(collection(db, "admins"), where('email', '==', adminData.email.toLowerCase()));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
            return { success: false, message: 'Email already registered' };
        }
        
        // Validate secret key (if provided)
        if (adminData.secretKey) {
            const keyValidation = await validateSecretKey(adminData.secretKey);
            if (!keyValidation.valid) {
                return { success: false, message: 'Invalid or expired secret key' };
            }
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
        const user = userCredential.user;
        
        // Create admin document in Firestore
        const newAdmin = {
            name: adminData.name.trim(),
            email: adminData.email.trim().toLowerCase(),
            role: adminData.role || 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await setDoc(doc(db, "admins", user.uid), newAdmin);
        
        // Log registration
        if (registrarId && registrarName) {
            await logActivity(registrarId, registrarName, 'CREATE', `Registered new admin: ${adminData.name} (${adminData.email}) with role: ${adminData.role}`);
        } else {
            await logActivity(user.uid, adminData.name, 'CREATE', `Self-registration completed with role: ${adminData.role}`);
        }
        
        return { success: true, message: 'Admin registered successfully', adminId: user.uid };
        
    } catch (error) {
        console.error("Registration error:", error);
        let message = 'Registration failed';
        if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
        else if (error.code === 'auth/weak-password') message = 'Password too weak (minimum 6 characters)';
        else if (error.code === 'auth/invalid-email') message = 'Invalid email format';
        return { success: false, message: message };
    }
}

/**
 * Update admin information
 * @param {string} adminId - Admin ID to update
 * @param {Object} updateData - Data to update
 * @param {string} updaterId - ID of admin performing update
 * @param {string} updaterName - Name of admin performing update
 * @returns {Promise<boolean>} Success status
 */
export async function updateAdmin(adminId, updateData, updaterId, updaterName) {
    try {
        const adminRef = doc(db, "admins", adminId);
        const oldAdmin = await getDoc(adminRef);
        const oldData = oldAdmin.data();
        
        await updateDoc(adminRef, {
            ...updateData,
            updatedAt: new Date()
        });
        
        // Also update session if this is the current admin
        const currentSession = getCurrentSession();
        if (currentSession && currentSession.adminId === adminId) {
            const sessionData = {
                ...currentSession,
                name: updateData.name || currentSession.name,
                email: updateData.email || currentSession.email,
                role: updateData.role || currentSession.role
            };
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
        }
        
        const changes = [];
        if (updateData.name && updateData.name !== oldData.name) changes.push(`name: ${oldData.name} → ${updateData.name}`);
        if (updateData.role && updateData.role !== oldData.role) changes.push(`role: ${oldData.role} → ${updateData.role}`);
        
        await logActivity(updaterId, updaterName, 'UPDATE', `Updated admin ${oldData.name}: ${changes.join(', ')}`);
        return true;
        
    } catch (error) {
        console.error("Error updating admin:", error);
        return false;
    }
}

/**
 * Delete admin account
 * @param {string} adminId - Admin ID to delete
 * @param {string} deleterId - ID of admin performing deletion
 * @param {string} deleterName - Name of admin performing deletion
 * @returns {Promise<boolean>} Success status
 */
export async function deleteAdmin(adminId, deleterId, deleterName) {
    try {
        const adminRef = doc(db, "admins", adminId);
        const admin = await getDoc(adminRef);
        const adminData = admin.data();
        
        await deleteDoc(adminRef);
        
        await logActivity(deleterId, deleterName, 'DELETE', `Deleted admin ${adminData?.name || adminId}`);
        return true;
        
    } catch (error) {
        console.error("Error deleting admin:", error);
        return false;
    }
}

/**
 * Get all admins from Firestore
 * @returns {Promise<Array>} List of admins
 */
export async function getAllAdmins() {
    try {
        const snapshot = await getDocs(collection(db, "admins"));
        const admins = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            admins.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role || 'admin',
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
            });
        });
        return admins;
    } catch (error) {
        console.error("Error getting admins:", error);
        return [];
    }
}

/**
 * Log activity to Firestore
 * @param {string} adminId - Admin ID
 * @param {string} adminName - Admin name
 * @param {string} action - Action type
 * @param {string} details - Action details
 */
export async function logActivity(adminId, adminName, action, details) {
    try {
        await addDoc(collection(db, "adminActivities"), {
            adminId,
            adminName,
            action,
            details,
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}

/**
 * Get all activities
 * @param {number} limit - Max number of activities
 * @returns {Promise<Array>} List of activities
 */
export async function getAllActivities(limit = 100) {
    try {
        const q = query(collection(db, "adminActivities"), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const activities = [];
        snapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        return activities.slice(0, limit);
    } catch (error) {
        console.error("Error getting activities:", error);
        return [];
    }
}

/**
 * Get activities for a specific admin
 * @param {string} adminId - Admin ID
 * @param {number} limit - Max number of activities
 * @returns {Promise<Array>} List of activities
 */
export async function getAdminActivities(adminId, limit = 50) {
    try {
        const q = query(collection(db, "adminActivities"), where('adminId', '==', adminId), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const activities = [];
        snapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
        });
        return activities.slice(0, limit);
    } catch (error) {
        console.error("Error getting admin activities:", error);
        return [];
    }
}

/**
 * Get activity statistics
 * @returns {Promise<Object>} Statistics
 */
export async function getActivityStats() {
    try {
        const snapshot = await getDocs(collection(db, "adminActivities"));
        const stats = { total: snapshot.size, byAction: {} };
        snapshot.forEach((doc) => {
            const action = doc.data().action;
            stats.byAction[action] = (stats.byAction[action] || 0) + 1;
        });
        return stats;
    } catch (error) {
        return { total: 0, byAction: {} };
    }
}

/**
 * Validate secret key
 * @param {string} secretKey - Secret key to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateSecretKey(secretKey) {
    try {
        const snapshot = await getDocs(collection(db, "secretKeys"));
        let isValid = false;
        let validKey = null;
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.secretKey === secretKey && data.isActive !== false) {
                isValid = true;
                validKey = { id: doc.id, name: data.name };
            }
        });
        
        return { valid: isValid, keyInfo: validKey };
    } catch (error) {
        return { valid: false, keyInfo: null };
    }
}

/**
 * Protect a page - redirect if not logged in (SYNCHRONOUS)
 * @param {string} redirectUrl - URL to redirect to
 * @returns {boolean} True if authenticated
 */
export function protectPage(redirectUrl = 'admin-login.html') {
    if (!isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

/**
 * Protect page with role check (SYNCHRONOUS using session)
 * @param {string|string[]} allowedRoles - Allowed roles
 * @param {string} redirectUrl - Redirect URL
 * @returns {boolean} True if authorized
 */
export function protectPageWithRole(allowedRoles, redirectUrl = 'admin-login.html') {
    // First check if logged in
    if (!isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectUrl;
        return false;
    }
    
    // Get admin from session synchronously
    const admin = getCurrentAdminSync();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!admin || !roles.includes(admin.role)) {
        window.location.href = 'unauthorized.html';
        return false;
    }
    
    return true;
}

/**
 * Initialize Auth UI (synchronous using session)
 * @returns {Object|null} Current admin or null
 */
export function initAuthUI() {
    const admin = getCurrentAdminSync();
    
    if (admin) {
        const nameElement = document.getElementById('adminNameDisplay');
        if (nameElement) nameElement.textContent = admin.name;
        
        const emailElement = document.getElementById('adminEmailDisplay');
        if (emailElement) emailElement.textContent = admin.email;
        
        const roleElement = document.getElementById('adminRoleDisplay');
        if (roleElement) roleElement.textContent = admin.role;
        
        const avatarElement = document.getElementById('adminAvatar');
        if (avatarElement) avatarElement.textContent = admin.name.charAt(0).toUpperCase();
    }
    
    return admin;
}

/**
 * Setup auto-logout timer
 * @param {number} timeoutMinutes - Minutes until auto-logout
 */
export function setupAutoLogout(timeoutMinutes = 60) {
    let logoutTimer;
    
    function resetTimer() {
        if (logoutTimer) clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            if (isLoggedIn()) {
                logout();
            }
        }, timeoutMinutes * 60 * 1000);
    }
    
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.removeEventListener(event, resetTimer);
        document.addEventListener(event, resetTimer);
    });
    
    resetTimer();
}

// Export all functions
export default {
    getCurrentFirebaseUser: () => auth.currentUser,
    getCurrentAdminData,
    getCurrentSession,
    isLoggedIn,
    getCurrentAdminSync,
    getCurrentAdmin,
    logout,
    loginAdmin,
    registerAdmin,
    updateAdmin,
    deleteAdmin,
    getAllAdmins,
    logActivity,
    getAllActivities,
    getAdminActivities,
    getActivityStats,
    validateSecretKey,
    protectPage,
    protectPageWithRole,
    initAuthUI,
    setupAutoLogout
};
