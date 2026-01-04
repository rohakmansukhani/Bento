/**
 * Centralized Route Configuration
 * All application routes in one place
 */

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

export const PublicRoutes = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
} as const;

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

export const ProtectedRoutes = {
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
} as const;

// ============================================================================
// DASHBOARD TABS (Query Params)
// ============================================================================

export const DashboardTabs = {
    OVERVIEW: 'overview',
    CHAT: 'chat',
    TERMINAL: 'terminal',
    HISTORY: 'history',
    POLICIES: 'policies',
    ADMIN: 'admin',
} as const;

// ============================================================================
// ROUTE HELPERS
// ============================================================================

export const Routes = {
    ...PublicRoutes,
    ...ProtectedRoutes,

    // Helper to build dashboard URL with tab
    dashboard: (tab?: string) => {
        if (tab) {
            return `${ProtectedRoutes.DASHBOARD}?tab=${tab}`;
        }
        return ProtectedRoutes.DASHBOARD;
    },

    // Helper to check if route is public
    isPublic: (path: string) => {
        return Object.values(PublicRoutes).includes(path as any);
    },

    // Helper to check if route is protected
    isProtected: (path: string) => {
        return Object.values(ProtectedRoutes).some(route => path.startsWith(route));
    },
} as const;

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

export interface NavItem {
    id: string;
    label: string;
    path: string;
    icon?: string;
    requiresAuth: boolean;
}

export const navigationItems: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        path: Routes.HOME,
        requiresAuth: false,
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: Routes.DASHBOARD,
        requiresAuth: true,
    },
    {
        id: 'profile',
        label: 'Profile',
        path: Routes.PROFILE,
        requiresAuth: true,
    },
    {
        id: 'settings',
        label: 'Settings',
        path: Routes.SETTINGS,
        requiresAuth: true,
    },
];
