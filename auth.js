// auth.js - Complete Authentication System
// Rules: Admins can read/write everything except secret keys
// Secret keys: Only super admin can read/write
// Anyone can register as admin (with or without secret key based on super admin setting)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
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
    setDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAR_g5y04YAGCrTvZCowrE7hw8h7k1du08",
    authDomain: "jujm-qirat.firebaseapp.com",
    projectId: "jujm-qirat",
    storageBucket: "jujm-qirat.firebasestorage.app",
    messagingSenderId: "253413984903",
    appId: "1:253413984903:web:c1577e0fdef1711f960622"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== SESSION MANAGEMENT ====================

export function getCurrentSession() {
    try {
        const session = localStorage.getItem('adminSession');
        if (!session) return null;
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
            logout();
            return null;
        }
        return sessionData;
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

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

export async function getCurrentAdmin() {
    const session = getCurrentSession();
    if (!session) return null;
    return {
        id: session.adminId,
        name: session.name,
        email: session.email,
        role: session.role
    };
}

export function isLoggedIn() {
    const session = getCurrentSession();
    return session !== null;
}

export async function logout() {
    try {
        const user = auth.currentUser;
        if (user) await signOut(auth);
        localStorage.removeItem('adminSession');
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('redirectAfterLogin');
        window.dispatchEvent(new CustomEvent('admin-logout'));
    } catch (error) {
        console.error("Logout error:", error);
    }
}

// ==================== AUTHENTICATION ====================

export async function loginAdmin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (!adminDoc.exists()) {
            await signOut(auth);
            return { success: false, message: 'Admin account not found' };
        }
        
        const adminData = adminDoc.data();
        const sessionData = {
            adminId: user.uid,
            name: adminData.name,
            email: adminData.email,
            role: adminData.role || 'admin',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('adminSession', JSON.stringify(sessionData));
        sessionStorage.setItem('adminLoggedIn', 'true');
        
        await logActivity(user.uid, adminData.name, 'LOGIN', 'Admin logged in');
        return { success: true, message: 'Login successful' };
        
    } catch (error) {
        let message = 'Login failed';
        if (error.code === 'auth/user-not-found') message = 'Email not found';
        else if (error.code === 'auth/wrong-password') message = 'Invalid password';
        else if (error.code === 'auth/invalid-email') message = 'Invalid email format';
        return { success: false, message: message };
    }
}

// Anyone can register as admin
// If secret key is provided and valid, they become admin
// If no secret key, they become regular admin (or viewer based on settings)
export async function registerAdmin(adminData) {
    try {
        // Check if email already exists
        const emailQuery = query(collection(db, "admins"), where('email', '==', adminData.email.toLowerCase()));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
            return { success: false, message: 'Email already registered' };
        }
        
        // Determine role based on secret key
        let role = 'admin'; // Default role for self-registration
        
        if (adminData.secretKey && adminData.secretKey.trim() !== '') {
            // Validate secret key - only super admin keys work
            const keyValidation = await validateSecretKey(adminData.secretKey);
            if (keyValidation.valid) {
                role = 'admin'; // Valid secret key grants admin access
            } else {
                return { success: false, message: 'Invalid secret key' };
            }
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
        const user = userCredential.user;
        
        // Create admin document
        const newAdmin = {
            name: adminData.name.trim(),
            email: adminData.email.trim().toLowerCase(),
            role: role,
            registeredAt: new Date(),
            createdAt: new Date()
        };
        
        await setDoc(doc(db, "admins", user.uid), newAdmin);
        await logActivity(user.uid, adminData.name, 'CREATE', `New admin registered with role: ${role}`);
        
        return { success: true, message: 'Admin registered successfully', adminId: user.uid };
        
    } catch (error) {
        let message = 'Registration failed';
        if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
        else if (error.code === 'auth/weak-password') message = 'Password too weak';
        return { success: false, message: message };
    }
}

// ==================== ADMIN MANAGEMENT ====================

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

export async function updateAdmin(adminId, updateData, updaterId, updaterName) {
    try {
        const adminRef = doc(db, "admins", adminId);
        const oldAdmin = await getDoc(adminRef);
        const oldData = oldAdmin.data();
        
        await updateDoc(adminRef, { ...updateData, updatedAt: new Date() });
        
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

// ==================== ACTIVITY LOGGING ====================

export async function logActivity(adminId, adminName, action, details) {
    try {
        await addDoc(collection(db, "adminActivities"), {
            adminId, adminName, action, details, timestamp: new Date()
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}

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
        return [];
    }
}

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
        return [];
    }
}

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

// ==================== SECRET KEYS - ONLY SUPER ADMIN ====================

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

export async function createSecretKey(keyData, adminId, adminName) {
    try {
        const currentAdmin = await getCurrentAdmin();
        if (currentAdmin?.role !== 'super-admin') {
            return { success: false, message: 'Only super admin can create secret keys' };
        }
        const result = await addDoc(collection(db, "secretKeys"), {
            ...keyData,
            createdAt: new Date(),
            createdBy: adminName,
            createdById: adminId
        });
        await logActivity(adminId, adminName, 'CREATE', `Created secret key: ${keyData.name}`);
        return { success: true, id: result.id };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function deleteSecretKey(keyId, adminId, adminName) {
    try {
        const currentAdmin = await getCurrentAdmin();
        if (currentAdmin?.role !== 'super-admin') {
            return { success: false, message: 'Only super admin can delete secret keys' };
        }
        await deleteDoc(doc(db, "secretKeys", keyId));
        await logActivity(adminId, adminName, 'DELETE', `Deleted secret key`);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export async function getAllSecretKeys() {
    try {
        const currentAdmin = await getCurrentAdmin();
        if (currentAdmin?.role !== 'super-admin') {
            return [];
        }
        const snapshot = await getDocs(collection(db, "secretKeys"));
        const keys = [];
        snapshot.forEach((doc) => {
            keys.push({ id: doc.id, ...doc.data() });
        });
        return keys;
    } catch (error) {
        return [];
    }
}

// ==================== PAGE PROTECTION ====================

export function protectPage(redirectUrl = 'admin-login.html') {
    if (!isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

export async function protectPageWithRole(allowedRoles, redirectUrl = 'admin-login.html') {
    if (!isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = redirectUrl;
        return false;
    }
    
    const admin = await getCurrentAdmin();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!admin || !roles.includes(admin.role)) {
        window.location.href = 'unauthorized.html';
        return false;
    }
    return true;
}

export function initAuthUI() {
    const admin = getCurrentAdminSync();
    if (admin) {
        const nameEl = document.getElementById('adminNameDisplay');
        if (nameEl) nameEl.textContent = admin.name;
        const emailEl = document.getElementById('adminEmailDisplay');
        if (emailEl) emailEl.textContent = admin.email;
        const roleEl = document.getElementById('adminRoleDisplay');
        if (roleEl) roleEl.textContent = admin.role;
        const avatarEl = document.getElementById('adminAvatar');
        if (avatarEl) avatarEl.textContent = admin.name.charAt(0).toUpperCase();
    }
    return admin;
}

export function setupAutoLogout(timeoutMinutes = 60) {
    let logoutTimer;
    function resetTimer() {
        if (logoutTimer) clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            if (isLoggedIn()) logout();
        }, timeoutMinutes * 60 * 1000);
    }
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
        document.removeEventListener(event, resetTimer);
        document.addEventListener(event, resetTimer);
    });
    resetTimer();
}

// ==================== EXPORTS ====================

export default {
    getCurrentSession,
    getCurrentAdminSync,
    getCurrentAdmin,
    isLoggedIn,
    logout,
    loginAdmin,
    registerAdmin,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    logActivity,
    getAllActivities,
    getAdminActivities,
    getActivityStats,
    validateSecretKey,
    createSecretKey,
    deleteSecretKey,
    getAllSecretKeys,
    protectPage,
    protectPageWithRole,
    initAuthUI,
    setupAutoLogout
};
