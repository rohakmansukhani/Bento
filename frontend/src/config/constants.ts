/**
 * Centralized Constants
 * All application constants in one place
 */

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

export const ChatStatus = {
    IDLE: 'IDLE',
    SCANNING: 'SCANNING',
    INTERCEPTED: 'INTERCEPTED',
    RESUMING: 'RESUMING',
} as const;

export type ChatStatusType = typeof ChatStatus[keyof typeof ChatStatus];

export const VerdictType = {
    VALID: 'VALID',
    FLAGGED: 'FLAGGED',
    BLOCKED: 'BLOCKED',
    CANCELLED: 'CANCELLED',
} as const;

export type VerdictTypeValue = typeof VerdictType[keyof typeof VerdictType];

// ============================================================================
// PROFILE CONSTANTS
// ============================================================================

export const ProfileIcons = {
    BRIEFCASE: 'Briefcase',
    BOOK: 'BookOpen',
    HOME: 'Home',
    TERMINAL: 'Terminal',
    SHIELD: 'Shield',
    LOCK: 'Lock',
} as const;

export const PROFILE_ICON_LIST = Object.values(ProfileIcons);

export const ProfileColors = {
    AMBER: 'text-amber_neon',
    EMERALD: 'text-emerald-400',
    SKY: 'text-sky-400',
    VIOLET: 'text-violet-400',
    ROSE: 'text-rose-400',
} as const;

export const PROFILE_COLOR_LIST = Object.values(ProfileColors);

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const NavTabs = {
    OVERVIEW: 'overview',
    CHAT: 'chat',
    TERMINAL: 'terminal',
    HISTORY: 'history',
    POLICIES: 'policies',
    ADMIN: 'admin',
} as const;

export type NavTabType = typeof NavTabs[keyof typeof NavTabs];

export const TimeRanges = {
    ONE_HOUR: '1h',
    TWENTY_FOUR_HOURS: '24h',
    SEVEN_DAYS: '7d',
    THIRTY_DAYS: '30d',
} as const;

export type TimeRangeType = typeof TimeRanges[keyof typeof TimeRanges];

// ============================================================================
// SIZE LIMITS
// ============================================================================

export const SizeLimits = {
    MAX_PROFILE_NAME_LENGTH: 50,
    MAX_KEYWORD_LENGTH: 100,
    MAX_KEYWORDS_COUNT: 50,
    MAX_MESSAGE_LENGTH: 10000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

export const TimeConstants = {
    DEBOUNCE_DELAY: 300, // ms
    TOAST_DURATION: 3000, // ms
    ANIMATION_DURATION: 200, // ms
    POLLING_INTERVAL: 5000, // ms
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ErrorMessages = {
    // Authentication
    UNAUTHORIZED: 'Please sign in to continue',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',

    // Validation
    INVALID_INPUT: 'Invalid input. Please check your data.',
    REQUIRED_FIELD: 'This field is required',
    NAME_TOO_LONG: `Name must be less than ${SizeLimits.MAX_PROFILE_NAME_LENGTH} characters`,
    TOO_MANY_KEYWORDS: `Maximum ${SizeLimits.MAX_KEYWORDS_COUNT} keywords allowed`,

    // Network
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT: 'Request timed out. Please try again.',

    // Resources
    PROFILE_NOT_FOUND: 'Profile not found',
    NO_ACTIVE_PROFILE: 'Please select an active profile',

    // Generic
    SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SuccessMessages = {
    PROFILE_CREATED: 'Profile created successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    PROFILE_DELETED: 'Profile deleted successfully',
    PROFILE_ACTIVATED: 'Profile activated',
    MESSAGE_SENT: 'Message sent successfully',
    COPIED_TO_CLIPBOARD: 'Copied to clipboard',
} as const;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

export const AnimationVariants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    },
    slideDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },
    scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
} as const;

// ============================================================================
// CHART COLORS
// ============================================================================

export const ChartColors = {
    PRIMARY: '#f59e0b', // amber-500
    SECONDARY: '#10b981', // emerald-500
    DANGER: '#ef4444', // red-500
    WARNING: '#fbbf24', // amber-400
    INFO: '#3b82f6', // blue-500
    SUCCESS: '#22c55e', // green-500
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const ZIndex = {
    BASE: 0,
    DROPDOWN: 10,
    STICKY: 20,
    FIXED: 30,
    MODAL_BACKDROP: 40,
    MODAL: 50,
    POPOVER: 60,
    TOOLTIP: 70,
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const StorageKeys = {
    ACTIVE_PROFILE: 'bento_active_profile',
    ACTIVE_MODEL: 'bento_active_model',
    THEME: 'bento_theme',
    SIDEBAR_COLLAPSED: 'bento_sidebar_collapsed',
    RECENT_SEARCHES: 'bento_recent_searches',
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const RegexPatterns = {
    EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
    PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DefaultValues = {
    PROFILE: {
        icon: ProfileIcons.BRIEFCASE,
        color: ProfileColors.AMBER,
        toggles: {
            email: true,
            phone: true,
            names: true,
            payment: true,
            location: true,
            credentials: true,
        },
        customKeywords: [],
    },
    ANALYTICS_RANGE: TimeRanges.TWENTY_FOUR_HOURS,
    SAFETY_SCORE: 100,
} as const;
