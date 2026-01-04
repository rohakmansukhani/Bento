/**
 * Centralized API Configuration
 * All API endpoints and request configurations in one place
 */

// ============================================================================
// BASE CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

export const ApiConfig = {
    BASE_URL: API_BASE_URL,
    VERSION: API_VERSION,
    PREFIX: API_PREFIX,
    TIMEOUT: 30000, // 30 seconds
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const ApiEndpoints = {
    // Intercept
    INTERCEPT: `${API_PREFIX}/intercept`,
    CONFIRM: `${API_PREFIX}/intercept/confirm`,
    CANCEL: `${API_PREFIX}/intercept/cancel`,

    // Profiles
    PROFILES: `${API_PREFIX}/profiles`,
    PROFILE_BY_ID: (id: string) => `${API_PREFIX}/profiles/${id}`,
    PROFILE_STATUS: `${API_PREFIX}/profiles/status`,
    ACTIVATE_PROFILE: (id: string) => `${API_PREFIX}/profiles/${id}/activate`,

    // Analytics
    ANALYTICS: `${API_PREFIX}/analytics`,
    ANALYTICS_WITH_RANGE: (range: string) => `${API_PREFIX}/analytics?range=${range}`,

    // History
    HISTORY: `${API_PREFIX}/history`,
    EXPORT: `${API_PREFIX}/export`,

    // Health
    HEALTH: '/health',
    METRICS: '/metrics',
} as const;

// ============================================================================
// REQUEST HEADERS
// ============================================================================

export const getAuthHeaders = (token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export const getMultipartHeaders = (token?: string) => {
    const headers: Record<string, string> = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for multipart, browser will set it with boundary
    return headers;
};

// ============================================================================
// REQUEST CONFIGURATIONS
// ============================================================================

export const RequestConfig = {
    DEFAULT: {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
    },

    POST: {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
    },

    PUT: {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
    },

    DELETE: {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
    },

    PATCH: {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
    },
} as const;

// ============================================================================
// API CLIENT
// ============================================================================

export class ApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = API_BASE_URL, timeout: number = ApiConfig.TIMEOUT) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            }

            throw new Error('Unknown error occurred');
        }
    }

    async get<T>(endpoint: string, token?: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
            headers: getAuthHeaders(token),
            credentials: 'include',
        });
    }

    async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            headers: getAuthHeaders(token),
            credentials: 'include',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: any, token?: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            headers: getAuthHeaders(token),
            credentials: 'include',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string, token?: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
            credentials: 'include',
        });
    }

    async patch<T>(endpoint: string, data: any, token?: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            headers: getAuthHeaders(token),
            credentials: 'include',
            body: JSON.stringify(data),
        });
    }
}

// Singleton instance
export const apiClient = new ApiClient();

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface ApiError {
    detail: string;
    status: number;
    timestamp?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
