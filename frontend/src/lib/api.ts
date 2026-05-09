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
    updateOnboarding: (data: any) => apiCall<any>("/api/auth/onboarding", { method: "PATCH", body: JSON.stringify(data) }),
    updateProfile: (data: any) => apiCall<any>("/api/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
    therapistOnboarding: (data: any) => apiCall<any>("/api/auth/therapist/onboarding", { method: "POST", body: JSON.stringify(data) }),
  },

  admin: {
    pendingTherapists: () => apiCall<any>("/api/admin/pending-therapists"),
    verifyTherapist: (id: string, data: { verified: boolean, password?: string }) => 
      apiCall<any>(`/api/admin/therapist/${id}/verify`, { method: "PATCH", body: JSON.stringify(data) }),
    pendingOrgs: () => apiCall<any>("/api/admin/pending-orgs"),
    verifyOrg: (id: string, data: { verified: boolean, password?: string }) => 
      apiCall<any>(`/api/admin/org/${id}/verify`, { method: "PATCH", body: JSON.stringify(data) }),
    createPlan: (data: any) => apiCall<any>("/api/admin/plans", { method: "POST", body: JSON.stringify(data) }),
    updatePlan: (id: string, data: any) => apiCall<any>(`/api/admin/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deletePlan: (id: string, data: any) => apiCall<any>(`/api/admin/plans/${id}`, { method: "DELETE", body: JSON.stringify(data) }),
  },

  org: {
    me: () => apiCall<any>("/api/org/me"),
    verifiedOrgs: () => apiCall<any>("/api/org/verified"),
    sendOtp: (data: { email: string }) => apiCall<any>("/api/org/send-otp", { method: "POST", body: JSON.stringify(data) }),
    verifyOtp: (data: { email: string, otp: string }) => apiCall<any>("/api/org/verify-otp", { method: "POST", body: JSON.stringify(data) }),
    onboarding: (data: any) => apiCall<any>("/api/org/onboarding", { method: "POST", body: JSON.stringify(data) }),
    pendingTherapists: () => apiCall<any>("/api/org/pending-therapists"),
    verifyTherapist: (id: string, data: { verified: boolean }) => apiCall<any>(`/api/org/therapist/${id}/verify`, { method: "PATCH", body: JSON.stringify(data) }),
    // Join request flow
    requestJoin: (data: { orgId: string, email?: string }) => apiCall<any>("/api/org/request-join", { method: "POST", body: JSON.stringify(data) }),
    joinRequests: () => apiCall<any>("/api/org/join-requests"),
    approveJoinRequest: (userId: string) => apiCall<any>(`/api/org/join-request/${userId}/approve`, { method: "PATCH", body: JSON.stringify({}) }),
    rejectJoinRequest: (userId: string) => apiCall<any>(`/api/org/join-request/${userId}/reject`, { method: "PATCH", body: JSON.stringify({}) }),
    // Excel email whitelist
    uploadEmails: async (file: File) => {
      const headers: Record<string, string> = {};
      if (_getToken) {
        const token = await _getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/api/org/upload-emails`, { method: "POST", headers, body: formData });
      if (!response.ok) { const err = await response.json().catch(() => ({ message: "Upload failed" })); throw new Error(err.message); }
      return response.json();
    },
    // Member data
    members: () => apiCall<any>("/api/org/members"),
    userDataForOrg: (userId: string) => apiCall<any>(`/api/org/user-data/${userId}`),
    stats: () => apiCall<any>("/api/org/stats"),
  },

  plan: {
    getAll: (audience?: string) => apiCall<any>(`/api/plans${audience ? `?audience=${audience}` : ''}`),
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
