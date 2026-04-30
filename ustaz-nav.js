/**
 * Ustaz Portal - Responsive Navigation Component
 * Features:
 * - Bottom navigation for mobile devices
 * - Horizontal header navigation for desktop/tablet
 * - Active route highlighting
 * - User profile quick access
 * - Theme toggling integration
 * - Smooth transitions
 */

// Navigation Configuration
const USTAZ_NAV_CONFIG = {
    // Define all routes
    routes: [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: 'fas fa-chalkboard-user',
            path: 'ustaz-dashboard.html',
            mobileOrder: 1,
            desktopOrder: 1
        },
        {
            id: 'import',
            name: 'Import Points',
            icon: 'fas fa-cloud-upload-alt',
            path: 'ustaz-import.html',
            mobileOrder: 2,
            desktopOrder: 2
        },
        {
            id: 'profile',
            name: 'My Profile',
            icon: 'fas fa-user-circle',
            path: 'ustaz-profile.html',
            mobileOrder: 3,
            desktopOrder: 3
        },
        {
            id: 'reports',
            name: 'Reports',
            icon: 'fas fa-chart-line',
            path: 'ustaz-reports.html',
            mobileOrder: 5,
            desktopOrder: 5
        }
    ],
    
    // Brand configuration
    brand: {
        name: 'Irshad',
        icon: 'fas fa-book-quran',
        shortName: 'Irshad app'
    },
    
    // Colors (CSS variables will override)
    colors: {
        accent: '#6366f1',
        bg: '#0f172a',
        text: '#f1f5f9'
    }
};

// Navigation Component Class
class UstazNavigation {
    constructor(options = {}) {
        this.config = { ...USTAZ_NAV_CONFIG, ...options };
        this.currentPath = window.location.pathname.split('/').pop() || 'ustaz-dashboard.html';
        this.isMobile = window.innerWidth < 768;
        this.navLoaded = false;
        this.userInfo = null;
        
        this.init();
    }
    
    init() {
        this.loadUserInfo();
        this.createNavigation();
        this.bindEvents();
        this.highlightActiveRoute();
    }
    
    loadUserInfo() {
        // Get user info from localStorage
        this.userInfo = {
            fullName: localStorage.getItem('ustazFullName') || 'Ustaz',
            username: localStorage.getItem('ustazName') || 'teacher',
            qiratsCount: JSON.parse(localStorage.getItem('ustazQirats') || '[]').length,
            avatar: localStorage.getItem('ustazAvatar') || null
        };
    }
    
    getInitials(name) {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    createNavigation() {
        // Check if nav already exists
        if (document.getElementById('ustazNavRoot')) {
            return;
        }
        
        // Create nav container
        const navContainer = document.createElement('div');
        navContainer.id = 'ustazNavRoot';
        navContainer.className = 'ustaz-nav-container';
        
        if (this.isMobile) {
            navContainer.innerHTML = this.renderMobileNav();
            document.body.appendChild(navContainer);
            this.adjustBodyPadding(true);
        } else {
            navContainer.innerHTML = this.renderDesktopNav();
            document.body.insertBefore(navContainer, document.body.firstChild);
            this.adjustBodyPadding(false);
        }
        
        this.navLoaded = true;
        this.injectStyles();
    }
    
    renderMobileNav() {
        const sortedRoutes = [...this.config.routes].sort((a, b) => a.mobileOrder - b.mobileOrder);
        
        return `
            <nav class="ustaz-mobile-nav">
                <div class="ustaz-mobile-nav-inner">
                    ${sortedRoutes.map(route => `
                        <a href="${route.path}" 
                           class="ustaz-mobile-nav-item ${this.isActiveRoute(route.path) ? 'active' : ''}"
                           data-route="${route.id}">
                            <i class="${route.icon}"></i>
                            <span>${route.name}</span>
                        </a>
                    `).join('')}
                </div>
                <div class="ustaz-mobile-safe-area"></div>
            </nav>
        `;
    }
    
    renderDesktopNav() {
        const sortedRoutes = [...this.config.routes].sort((a, b) => a.desktopOrder - b.desktopOrder);
        const initials = this.getInitials(this.userInfo.fullName);
        
        return `
            <nav class="ustaz-desktop-nav">
                <div class="ustaz-desktop-nav-container">
                    <!-- Brand Logo -->
                    <div class="ustaz-nav-brand">
                        <a href="ustaz-dashboard.html" class="ustaz-brand-link">
                            <i class="${this.config.brand.icon}"></i>
                            <span class="ustaz-brand-text">${this.config.brand.name}</span>
                        </a>
                    </div>
                    
                    <!-- Navigation Links -->
                    <div class="ustaz-nav-links">
                        ${sortedRoutes.map(route => `
                            <a href="${route.path}" 
                               class="ustaz-nav-link ${this.isActiveRoute(route.path) ? 'active' : ''}"
                               data-route="${route.id}">
                                <i class="${route.icon}"></i>
                                <span>${route.name}</span>
                            </a>
                        `).join('')}
                    </div>
                    
                    <!-- Right Section -->
                    <div class="ustaz-nav-right">
                        <!-- Theme Toggle -->
                        <button class="ustaz-theme-toggle" id="ustazThemeToggle">
                            <i class="fas fa-moon"></i>
                        </button>
                        
                        <!-- User Dropdown -->
                        <div class="ustaz-user-dropdown">
                            <button class="ustaz-user-btn" id="ustazUserBtn">
                                <div class="ustaz-user-avatar">
                                    ${this.userInfo.avatar ? 
                                        `<img src="${this.userInfo.avatar}" alt="${this.userInfo.fullName}">` : 
                                        `<span>${initials}</span>`
                                    }
                                </div>
                                <span class="ustaz-user-name">${this.userInfo.fullName}</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="ustaz-dropdown-menu" id="ustazDropdownMenu">
                                <a href="ustaz-profile.html" class="ustaz-dropdown-item">
                                    <i class="fas fa-user-circle"></i> My Profile
                                </a>
                                <a href="ustaz-dashboard.html" class="ustaz-dropdown-item">
                                    <i class="fas fa-chalkboard-user"></i> Dashboard
                                </a>
                                <div class="ustaz-dropdown-divider"></div>
                                <button onclick="window.ustazLogout?.()" class="ustaz-dropdown-item logout-item" id="ustazLogoutBtn">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }
    
    injectStyles() {
        if (document.getElementById('ustaz-nav-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ustaz-nav-styles';
        styles.textContent = `
            /* Root Variables */
            :root {
                --ustaz-accent: #6366f1;
                --ustaz-accent-hover: #818cf8;
                --ustaz-bg: #0f172a;
                --ustaz-surface: #1e293b;
                --ustaz-text: #f1f5f9;
                --ustaz-text-secondary: #94a3b8;
                --ustaz-border: rgba(255, 255, 255, 0.1);
                --ustaz-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                --ustaz-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            body.light-mode {
                --ustaz-bg: #ffffff;
                --ustaz-surface: #f1f5f9;
                --ustaz-text: #0f172a;
                --ustaz-text-secondary: #475569;
                --ustaz-border: rgba(0, 0, 0, 0.08);
            }
            
            /* Desktop Navigation */
            .ustaz-desktop-nav {
                position: sticky;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                background: var(--ustaz-bg);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid var(--ustaz-border);
                padding: 0.75rem 1.5rem;
            }
            
            .ustaz-desktop-nav-container {
                max-width: 1400px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2rem;
            }
            
            /* Brand */
            .ustaz-nav-brand {
                flex-shrink: 0;
            }
            
            .ustaz-brand-link {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                text-decoration: none;
                font-size: 1.25rem;
                font-weight: 700;
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                transition: var(--ustaz-transition);
            }
            
            .ustaz-brand-link i {
                font-size: 1.5rem;
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            
            /* Nav Links */
            .ustaz-nav-links {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
            }
            
            .ustaz-nav-link {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 1.2rem;
                border-radius: 0.75rem;
                text-decoration: none;
                color: var(--ustaz-text-secondary);
                font-size: 0.9rem;
                font-weight: 500;
                transition: var(--ustaz-transition);
            }
            
            .ustaz-nav-link i {
                font-size: 1rem;
                width: 1.25rem;
            }
            
            .ustaz-nav-link:hover {
                background: rgba(99, 102, 241, 0.1);
                color: var(--ustaz-text);
                transform: translateY(-1px);
            }
            
            .ustaz-nav-link.active {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            /* Right Section */
            .ustaz-nav-right {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            /* Theme Toggle */
            .ustaz-theme-toggle {
                background: var(--ustaz-surface);
                border: 1px solid var(--ustaz-border);
                border-radius: 2rem;
                padding: 0.5rem;
                width: 2.5rem;
                height: 2.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: var(--ustaz-transition);
                color: var(--ustaz-text);
            }
            
            .ustaz-theme-toggle:hover {
                transform: rotate(15deg);
                background: var(--ustaz-accent);
                color: white;
            }
            
            /* User Dropdown */
            .ustaz-user-dropdown {
                position: relative;
            }
            
            .ustaz-user-btn {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: var(--ustaz-surface);
                border: 1px solid var(--ustaz-border);
                border-radius: 2rem;
                padding: 0.4rem 1rem 0.4rem 0.5rem;
                cursor: pointer;
                transition: var(--ustaz-transition);
                color: var(--ustaz-text);
            }
            
            .ustaz-user-btn:hover {
                background: rgba(99, 102, 241, 0.1);
                border-color: var(--ustaz-accent);
            }
            
            .ustaz-user-avatar {
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.8rem;
                color: white;
                overflow: hidden;
            }
            
            .ustaz-user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .ustaz-user-name {
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            .ustaz-dropdown-menu {
                position: absolute;
                top: calc(100% + 0.5rem);
                right: 0;
                min-width: 200px;
                background: var(--ustaz-bg);
                border: 1px solid var(--ustaz-border);
                border-radius: 1rem;
                padding: 0.5rem;
                box-shadow: var(--ustaz-shadow);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: var(--ustaz-transition);
                z-index: 1001;
            }
            
            .ustaz-user-dropdown.open .ustaz-dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .ustaz-dropdown-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 0.75rem;
                text-decoration: none;
                color: var(--ustaz-text);
                font-size: 0.85rem;
                transition: var(--ustaz-transition);
                cursor: pointer;
                width: 100%;
                background: none;
                border: none;
            }
            
            .ustaz-dropdown-item:hover {
                background: rgba(99, 102, 241, 0.1);
            }
            
            .ustaz-dropdown-item.logout-item {
                color: #ef4444;
            }
            
            .ustaz-dropdown-item.logout-item:hover {
                background: rgba(239, 68, 68, 0.1);
            }
            
            .ustaz-dropdown-divider {
                height: 1px;
                background: var(--ustaz-border);
                margin: 0.5rem 0;
            }
            
            /* Mobile Navigation */
            .ustaz-mobile-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                background: var(--ustaz-bg);
                backdrop-filter: blur(20px);
                border-top: 1px solid var(--ustaz-border);
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .ustaz-mobile-nav-inner {
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 0.5rem 0.75rem;
            }
            
            .ustaz-mobile-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                padding: 0.5rem 0.75rem;
                border-radius: 2rem;
                text-decoration: none;
                color: var(--ustaz-text-secondary);
                font-size: 0.7rem;
                transition: var(--ustaz-transition);
                flex: 1;
                text-align: center;
            }
            
            .ustaz-mobile-nav-item i {
                font-size: 1.25rem;
            }
            
            .ustaz-mobile-nav-item span {
                font-size: 0.65rem;
                font-weight: 500;
            }
            
            .ustaz-mobile-nav-item.active {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            .ustaz-mobile-nav-item:active {
                transform: scale(0.95);
            }
            
            .ustaz-mobile-safe-area {
                height: env(safe-area-inset-bottom, 0);
                background: transparent;
            }
            
            /* Responsive Adjustments */
            @media (max-width: 768px) {
                body {
                    padding-bottom: 70px !important;
                }
            }
            
            @media (min-width: 769px) {
                body {
                    padding-top: 70px !important;
                }
            }
            
            /* Animation */
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .ustaz-mobile-nav {
                animation: slideUp 0.3s ease;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    isActiveRoute(routePath) {
        // Extract filename from path
        const routeFile = routePath.split('/').pop();
        const currentFile = this.currentPath;
        
        // Special handling for dashboard as default
        if (currentFile === 'ustaz-dashboard.html' && routeFile === 'ustaz-dashboard.html') return true;
        if (currentFile === '' && routeFile === 'ustaz-dashboard.html') return true;
        
        return currentFile === routeFile;
    }
    
    adjustBodyPadding(isMobile) {
        if (isMobile) {
            document.body.style.paddingBottom = '70px';
            document.body.style.paddingTop = '0';
        } else {
            document.body.style.paddingTop = '70px';
            document.body.style.paddingBottom = '0';
        }
    }
    
    bindEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth < 768;
            if (newIsMobile !== this.isMobile) {
                this.isMobile = newIsMobile;
                // Remove existing nav and recreate
                const existingNav = document.getElementById('ustazNavRoot');
                if (existingNav) existingNav.remove();
                this.createNavigation();
                this.highlightActiveRoute();
            }
        });
        
        // User dropdown toggle for desktop
        setTimeout(() => {
            const userBtn = document.getElementById('ustazUserBtn');
            const dropdown = document.querySelector('.ustaz-user-dropdown');
            
            if (userBtn && dropdown) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                });
                
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdown.classList.remove('open');
                    }
                });
            }
            
            // Theme toggle
            const themeToggle = document.getElementById('ustazThemeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    document.body.classList.toggle('light-mode');
                    const icon = themeToggle.querySelector('i');
                    if (document.body.classList.contains('light-mode')) {
                        icon.className = 'fas fa-sun';
                    } else {
                        icon.className = 'fas fa-moon';
                    }
                });
            }
        }, 100);
    }
    
    highlightActiveRoute() {
        const activeLinks = document.querySelectorAll('.ustaz-nav-link.active, .ustaz-mobile-nav-item.active');
        activeLinks.forEach(link => link.classList.remove('active'));
        
        const currentLinks = document.querySelectorAll(`.ustaz-nav-link[href="${this.currentPath}"], .ustaz-mobile-nav-item[href="${this.currentPath}"]`);
        currentLinks.forEach(link => link.classList.add('active'));
    }
    
    refresh() {
        this.loadUserInfo();
        this.highlightActiveRoute();
    }
}

// Global logout function
window.ustazLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('ustazLoggedIn');
        localStorage.removeItem('ustazId');
        localStorage.removeItem('ustazName');
        localStorage.removeItem('ustazFullName');
        localStorage.removeItem('ustazQirats');
        window.location.href = 'ustaz-login.html';
    }
};

// Initialize navigation when DOM is ready
let ustazNavInstance = null;

function initUstazNavigation() {
    if (!ustazNavInstance && document.body) {
        ustazNavInstance = new UstazNavigation();
    }
    return ustazNavInstance;
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUstazNavigation);
} else {
    initUstazNavigation();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UstazNavigation, initUstazNavigation };
}
