/**
 * api.ts — Frontend API client
 * Uses Clerk session token in Authorization: Bearer header.
 * Call setTokenGetter(fn) once from ClerkProvider to inject the token getter.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Token getter injected by ClerkProvider wrapper
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Attach Clerk session token if available
  if (_getToken) {
    const token = await _getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "API Error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

const API = {
  health: () => apiCall<{ ok: boolean }>("/api/health"),
  auth: {
    me: () => apiCall<any>("/api/auth/me"),
    setRole: (role: string) => apiCall<any>("/api/auth/role", { method: "PATCH", body: JSON.stringify({ role }) }),
  },

  user: {
    stats: () => apiCall<any>("/api/user/stats"),
    update: (data: any) => apiCall<any>("/api/user/profile", { method: "PUT", body: JSON.stringify(data) }),
    profile: () => apiCall<any>("/api/user/profile"),
  },

  therapist: {
    list: (query?: Record<string, any>) => {
      const params = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
        });
      }
      return apiCall<any>(`/api/therapists?${params.toString()}`);
    },
    get: (id: string) => apiCall<any>(`/api/therapists/${id}`),
    availability: (id: string, query?: { date?: string }) => {
      const params = new URLSearchParams();
      if (query?.date) params.append('date', query.date);
      return apiCall<any>(`/api/therapists/${id}/availability?${params.toString()}`);
    },
    meStats: () => apiCall<any>('/api/therapists/me/stats'),
    meBookings: () => apiCall<any>('/api/therapists/me/bookings'),
    updateAvailability: (data: { availability: { day: number; slots: string[] }[] }) =>
      apiCall<any>('/api/therapists/me/availability', { method: 'PATCH', body: JSON.stringify(data) }),
    updateProfile: (data: any) =>
      apiCall<any>('/api/therapists/me/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  booking: {
    list: () => apiCall<any>("/api/bookings"),
    create: (data: { therapistId: string; slot: string }) =>
      apiCall<any>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiCall<any>(`/api/bookings/${id}`),
    cancel: (id: string) => apiCall<any>(`/api/bookings/${id}/cancel`, { method: "DELETE" }),
    getVideoToken: (id: string) => apiCall<any>(`/api/bookings/${id}/video-token`),
    rate: (id: string, data: { rating: number; feedback?: string }) =>
      apiCall<any>(`/api/bookings/${id}/rate`, { method: 'POST', body: JSON.stringify(data) }),
    getAiBrief: (id: string) => apiCall<any>(`/api/bookings/${id}/ai-brief`),
  },

  payment: {
    initiate: (data: { bookingId: string }) =>
      apiCall<any>("/api/payment/initiate", { method: "POST", body: JSON.stringify(data) }),
    verify: (data: { bookingId: string; orderId: string; paymentId: string; signature: string }) =>
      apiCall<any>("/api/payment/verify", { method: "POST", body: JSON.stringify(data) }),
    demoVerify: (data: { bookingId: string }) =>
      apiCall<any>("/api/payment/demo-verify", { method: "POST", body: JSON.stringify(data) }),
    status: (bookingId: string) => apiCall<any>(`/api/payment/${bookingId}`),
  },

  chat: {
    sendMessage: (data: { message: string }) =>
      apiCall<any>("/api/chat", { method: "POST", body: JSON.stringify(data) }),
    getMessages: () => apiCall<any>("/api/chat/history"),
  },

  mood: {
    list: () => apiCall<any>("/api/mood/history"),
    create: (data: any) => apiCall<any>("/api/mood", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiCall<any>(`/api/mood/${id}`),
  },

  journal: {
    list: () => apiCall<any>("/api/journal"),
    create: (data: any) => apiCall<any>("/api/journal", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiCall<any>(`/api/journal/${id}`),
  },

  subscription: {
    get: () => apiCall<any>("/api/subscription"),
    upgrade: (data: { tier: "mann_shanti" | "apna_therapist" }) =>
      apiCall<any>("/api/subscription/upgrade", { method: "POST", body: JSON.stringify(data) }),
    cancel: () => apiCall<any>("/api/subscription/cancel", { method: "POST" }),
    admin: { all: () => apiCall<any>("/api/subscription/admin/all") },
  },
};

export default API;
