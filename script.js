// Firebase Configuration (Modular SDK v9+)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged,
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase Config (Replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyABC123DEF456GHI789JKL012MNO345PQR",
    authDomain: "unified-student-growth.firebaseapp.com",
    projectId: "unified-student-growth",
    storageBucket: "unified-student-growth.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const mentorGrid = document.getElementById('mentorGrid');
const nearbyMentors = document.getElementById('nearbyMentors');
const upcomingSessions = document.getElementById('upcomingSessions');
const mentorModalOverlay = document.getElementById('mentorModalOverlay');
const mentorModalContent = document.getElementById('mentorModalContent');
const closeMentorModal = document.getElementById('closeMentorModal');
const findMentorBtn = document.getElementById('findMentorBtn');
const scheduleSessionBtn = document.getElementById('scheduleSessionBtn');
const joinCommunityBtn = document.getElementById('joinCommunityBtn');

// Current User State
let currentUser = null;
let currentStudentProfile = null;

// Collections Schema
const COLLECTIONS = {
    USERS: 'users',
    STUDENTS: 'students',
    MENTORS: 'mentors',
    SESSIONS: 'sessions',
    COMMUNITIES: 'communities',
    ANNOUNCEMENTS: 'announcements'
};

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
    loadDashboardData();
});

// Authentication & Authorization
async function initializeAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadStudentProfile(user.uid);
            // Verify user is student role
            if (!await checkUserRole('student')) {
                // Redirect if not student
                window.location.href = 'login.html';
                return;
            }
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });
}

// Load student profile from Firestore
async function loadStudentProfile(userId) {
    try {
        const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, userId));
        if (studentDoc.exists()) {
            currentStudentProfile = studentDoc.data();
            updateUIWithStudentProfile();
        } else {
            console.error('Student profile not found');
            // Redirect to onboarding
            window.location.href = 'student-onboarding.html';
        }
    } catch (error) {
        console.error('Error loading student profile:', error);
        showError('Failed to load profile');
    }
}

// Check user role in Firestore
async function checkUserRole(expectedRole) {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.role === expectedRole;
        }
        return false;
    } catch (error) {
        console.error('Error checking user role:', error);
        return false;
    }
}

// Update UI with student profile data
function updateUIWithStudentProfile() {
    if (currentStudentProfile) {
        // Update goal badge if exists
        const goalBadge = document.querySelector('.goal-badge span');
        if (goalBadge && currentStudentProfile.targetDepartment) {
            goalBadge.textContent = `Target: ${currentStudentProfile.targetDepartment}`;
        }
        
        // Update user badge
        const userName = document.querySelector('.user-name');
        const userGrade = document.querySelector('.user-grade');
        
        if (userName && currentStudentProfile.displayName) {
            userName.textContent = currentStudentProfile.displayName;
        }
        
        if (userGrade && currentStudentProfile.gradeLevel) {
            userGrade.textContent = currentStudentProfile.gradeLevel;
        }
    }
}

// Load all dashboard data
async function loadDashboardData() {
    showLoadingStates();
    
    try {
        await Promise.all([
            loadRecommendedMentors(),
            loadNearbyMentors(),
            loadUpcomingSessions()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load recommended mentors based on student's goal
async function loadRecommendedMentors() {
    if (!currentStudentProfile || !currentStudentProfile.targetDepartment) {
        showEmptyState(mentorGrid, 'Set your target department to get mentor recommendations');
        return;
    }
    
    try {
        // Query mentors in the target department, sorted by rating
        const mentorsQuery = query(
            collection(db, COLLECTIONS.MENTORS),
            where('department', '==', currentStudentProfile.targetDepartment),
            where('verificationStatus', '==', 'verified'),
            orderBy('rating', 'desc'),
            limit(6)
        );
        
        const snapshot = await getDocs(mentorsQuery);
        
        if (snapshot.empty) {
            showEmptyState(mentorGrid, 'No mentors found for your target department');
            return;
        }
        
        displayMentorsGrid(snapshot.docs);
    } catch (error) {
        console.error('Error loading recommended mentors:', error);
        showError(mentorGrid, 'Failed to load mentors');
    }
}

// Load mentors near student's location
async function loadNearbyMentors() {
    if (!currentStudentProfile || !currentStudentProfile.location) {
        // If no location set, show random mentors
        await loadRandomMentors();
        return;
    }
    
    try {
        // In production, use geoqueries. For demo, simulate nearby mentors
        const mentorsQuery = query(
            collection(db, COLLECTIONS.MENTORS),
            where('verificationStatus', '==', 'verified'),
            where('location.city', '==', 'Boston'),
            limit(4)
        );
        
        const snapshot = await getDocs(mentorsQuery);
        
        if (snapshot.empty) {
            showEmptyState(nearbyMentors, 'No nearby mentors found');
            return;
        }
        
        displayMentorsList(snapshot.docs);
    } catch (error) {
        console.error('Error loading nearby mentors:', error);
        showError(nearbyMentors, 'Failed to load nearby mentors');
    }
}

// Load random mentors as fallback
async function loadRandomMentors() {
    try {
        const mentorsQuery = query(
            collection(db, COLLECTIONS.MENTORS),
            where('verificationStatus', '==', 'verified'),
            limit(4)
        );
        
        const snapshot = await getDocs(mentorsQuery);
        
        if (!snapshot.empty) {
            displayMentorsList(snapshot.docs);
        }
    } catch (error) {
        console.error('Error loading random mentors:', error);
    }
}

// Load upcoming sessions for the student
async function loadUpcomingSessions() {
    try {
        const sessionsQuery = query(
            collection(db, COLLECTIONS.SESSIONS),
            where('studentId', '==', currentUser.uid),
            where('status', '==', 'scheduled'),
            where('scheduledTime', '>=', new Date()),
            orderBy('scheduledTime'),
            limit(3)
        );
        
        const snapshot = await getDocs(sessionsQuery);
        
        if (snapshot.empty) {
            // Empty state is already shown in HTML
            return;
        }
        
        displayUpcomingSessions(snapshot.docs);
    } catch (error) {
        console.error('Error loading upcoming sessions:', error);
    }
}

// Display mentors in grid layout
function displayMentorsGrid(mentorDocs) {
    mentorGrid.innerHTML = '';
    
    mentorDocs.forEach((docSnapshot) => {
        const mentor = docSnapshot.data();
        const mentorCard = createMentorCard(mentor, docSnapshot.id);
        mentorGrid.appendChild(mentorCard);
    });
}

// Display mentors in list layout
function displayMentorsList(mentorDocs) {
    nearbyMentors.innerHTML = '';
    
    mentorDocs.forEach((docSnapshot) => {
        const mentor = docSnapshot.data();
        const listItem = createMentorListItem(mentor, docSnapshot.id);
        nearbyMentors.appendChild(listItem);
    });
}

// Display upcoming sessions
function displayUpcomingSessions(sessionDocs) {
    upcomingSessions.innerHTML = '';
    
    sessionDocs.forEach((docSnapshot) => {
        const session = docSnapshot.data();
        const sessionElement = createSessionElement(session);
        upcomingSessions.appendChild(sessionElement);
    });
}

// Create mentor card element
function createMentorCard(mentor, mentorId) {
    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.dataset.mentorId = mentorId;
    
    // Format price
    const price = mentor.hourlyRate || 'Free';
    const priceDisplay = price === 'Free' ? 'Free' : `$${price}/hr`;
    
    // Create stars for rating
    const stars = '★'.repeat(Math.floor(mentor.rating || 0)) + 
                  '☆'.repeat(5 - Math.floor(mentor.rating || 0));
    
    card.innerHTML = `
        <div class="mentor-header">
            <div class="mentor-avatar">${mentor.displayName?.charAt(0) || 'M'}</div>
            <div class="mentor-info">
                <div class="mentor-name">${mentor.displayName || 'Mentor'}</div>
                <div class="mentor-university">${mentor.university || 'University'}</div>
                <div class="mentor-department">${mentor.department || 'Department'}</div>
                <div class="mentor-rating">
                    <span class="rating-stars">${stars}</span>
                    <span class="rating-value">${mentor.rating?.toFixed(1) || 'New'}</span>
                </div>
            </div>
        </div>
        
        <div class="mentor-tags">
            ${mentor.subjects?.slice(0, 3).map(subject => 
                `<span class="tag">${subject}</span>`
            ).join('') || ''}
        </div>
        
        <div class="mentor-footer">
            <div class="mentor-price">
                ${priceDisplay}
                <span> starting rate</span>
            </div>
            <button class="btn-primary btn-sm request-btn">Request Session</button>
        </div>
    `;
    
    // Add event listeners
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.request-btn')) {
            openMentorModal(mentor, mentorId);
        }
    });
    
    const requestBtn = card.querySelector('.request-btn');
    requestBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        requestSession(mentorId, mentor.displayName);
    });
    
    return card;
}

// Create mentor list item
function createMentorListItem(mentor, mentorId) {
    const listItem = document.createElement('div');
    listItem.className = 'mentor-list-item';
    listItem.dataset.mentorId = mentorId;
    
    listItem.innerHTML = `
        <div class="mentor-list-info">
            <div class="mentor-list-avatar">${mentor.displayName?.charAt(0) || 'M'}</div>
            <div>
                <div class="mentor-name">${mentor.displayName}</div>
                <div class="text-sm text-light">${mentor.department} • ${mentor.university}</div>
            </div>
        </div>
        <div class="mentor-distance">
            <i class="fas fa-map-marker-alt"></i>
            <span>2 miles away</span>
        </div>
    `;
    
    listItem.addEventListener('click', () => {
        openMentorModal(mentor, mentorId);
    });
    
    return listItem;
}

// Create session element
function createSessionElement(session) {
    const element = document.createElement('div');
    element.className = 'mentor-list-item';
    
    const date = new Date(session.scheduledTime?.toDate());
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    element.innerHTML = `
        <div class="mentor-list-info">
            <div class="mentor-list-avatar">${session.mentorName?.charAt(0) || 'M'}</div>
            <div>
                <div class="mentor-name">${session.mentorName || 'Mentor'}</div>
                <div class="text-sm text-light">${session.subject || 'General Tutoring'}</div>
            </div>
        </div>
        <div>
            <div class="font-semibold">${formattedDate}</div>
            <div class="text-sm text-light">${formattedTime}</div>
        </div>
    `;
    
    return element;
}

// Open mentor modal
function openMentorModal(mentor, mentorId) {
    const modalContent = createMentorModalContent(mentor);
    mentorModalContent.innerHTML = modalContent;
    mentorModalOverlay.style.display = 'flex';
    
    // Add event listener to request button in modal
    const modalRequestBtn = mentorModalContent.querySelector('.request-btn');
    if (modalRequestBtn) {
        modalRequestBtn.addEventListener('click', () => {
            requestSession(mentorId, mentor.displayName);
        });
    }
}

// Create mentor modal content
function createMentorModalContent(mentor) {
    const price = mentor.hourlyRate || 'Free';
    const priceDisplay = price === 'Free' ? 'Free' : `$${price}/hr`;
    
    const stars = '★'.repeat(Math.floor(mentor.rating || 0)) + 
                  '☆'.repeat(5 - Math.floor(mentor.rating || 0));
    
    return `
        <div class="modal-mentor-header">
            <div class="mentor-avatar large">${mentor.displayName?.charAt(0) || 'M'}</div>
            <div>
                <h3>${mentor.displayName || 'Mentor'}</h3>
                <div class="text-primary">${mentor.department} • ${mentor.university}</div>
                <div class="rating-stars mt-2">${stars} <span class="rating-value">${mentor.rating?.toFixed(1) || 'New'}</span></div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>About</h4>
            <p>${mentor.bio || 'Experienced mentor specializing in helping students achieve their academic goals.'}</p>
        </div>
        
        <div class="modal-section">
            <h4>Subjects & Expertise</h4>
            <div class="mentor-tags">
                ${mentor.subjects?.map(subject => 
                    `<span class="tag">${subject}</span>`
                ).join('') || '<span class="tag">General Tutoring</span>'}
            </div>
        </div>
        
        <div class="modal-section">
            <h4>Availability</h4>
            <p>${mentor.availability || 'Weekdays after 4 PM, Weekends 9 AM - 6 PM'}</p>
        </div>
        
        <div class="modal-section">
            <h4>Session Rate</h4>
            <div class="text-lg font-semibold">${priceDisplay}</div>
            ${price !== 'Free' ? '<p class="text-sm text-light mt-1">50-minute sessions</p>' : ''}
        </div>
        
        <div class="modal-actions">
            <button class="btn-secondary">Save Mentor</button>
            <button class="btn-primary request-btn">Request Session</button>
        </div>
    `;
}

// Request session with mentor
async function requestSession(mentorId, mentorName) {
    if (!currentUser) {
        showError('Please log in to request a session');
        return;
    }
    
    // In production, this would open a session request modal
    // For demo, simulate session request
    showSuccess('Session request sent to ' + mentorName);
    
    // Close modal if open
    closeMentorModal.click();
    
    // Navigate to sessions page
    setTimeout(() => {
        window.location.href = 'sessions.html';
    }, 1500);
}

// Join community
function setupCommunityJoinButtons() {
    document.querySelectorAll('.join-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const communityCard = e.target.closest('.community-card');
            const communityName = communityCard.querySelector('h3').textContent;
            
            // In production, add user to community in Firestore
            showSuccess(`Joined ${communityName}`);
            e.target.textContent = 'Joined';
            e.target.disabled = true;
            e.target.classList.remove('btn-secondary');
            e.target.classList.add('btn-primary');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Mentor modal close
    closeMentorModal.addEventListener('click', () => {
        mentorModalOverlay.style.display = 'none';
    });
    
    // Close modal when clicking overlay
    mentorModalOverlay.addEventListener('click', (e) => {
        if (e.target === mentorModalOverlay) {
            mentorModalOverlay.style.display = 'none';
        }
    });
    
    // Navigation buttons
    findMentorBtn.addEventListener('click', () => {
        window.location.href = 'mentor-discovery.html';
    });
    
    scheduleSessionBtn?.addEventListener('click', () => {
        window.location.href = 'mentor-discovery.html';
    });
    
    joinCommunityBtn.addEventListener('click', () => {
        window.location.href = 'communities.html';
    });
    
    // Setup community join buttons
    setupCommunityJoinButtons();
    
    // Setup announcement learn more buttons
    document.querySelectorAll('.announcement-card .btn-text').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const announcementTitle = e.target.closest('.announcement-card').querySelector('h3').textContent;
            showSuccess(`Opening details for: ${announcementTitle}`);
        });
    });
}

// Show loading states
function showLoadingStates() {
    // Loading states are handled by HTML skeleton
}

// Show empty state
function showEmptyState(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <p>${message}</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    // In production, use a toast notification system
    alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
    // In production, use a toast notification system
    alert('Success: ' + message);
}

// Logout function (for future use)
async function logout() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showError('Failed to log out');
    }
}

// Additional CSS for modal content
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal-mentor-header {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    .mentor-avatar.large {
        width: 80px;
        height: 80px;
        font-size: 2rem;
    }
    
    .modal-section {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .modal-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .modal-section h4 {
        margin-bottom: 0.75rem;
        color: var(--text-primary);
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
    
    .modal-actions .btn-primary,
    .modal-actions .btn-secondary {
        flex: 1;
    }
`;
document.head.appendChild(modalStyles);