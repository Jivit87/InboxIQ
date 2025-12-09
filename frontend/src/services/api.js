import axios from 'axios';

const API_BASE_URL = "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);
const removeToken = () => localStorage.removeItem("token");

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        if(error.response && error.response.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
)

export const authAPI = {
    register: async (email, password, name) => {
        const data = await api.post("/auth/register", (email, password, name));
        if (data.token){
            setToken(data.token);
        }
        return data
    },

    login: async (email, password) => {
        const data = await api.post("/auth/login", {email, password})
        if (data.token){
            setToken(data.token);
        }
        return data
    },
     
    logout: () => {
        removeToken();
    },

    getMe: async () => {
        return api.get("/auth/me");
    },

    getGoogleAuthUrl: async () => {
        const data = await api.get("/auth/google/auth-url");
        return data.authUrl;
    },

    connectGoogle: async (code) => {
        return api.post("/auth/google/connect", { code });
    },

    disconnectPlatform: async (platform) => {
        return api.post(`/auth/disconnect/${platform}`);
    },
}

// Emails
export const emailAPI = {
    getAll: async (page = 1, limit = 20) => {
        return api.get(`/emails?page=${page}&limit=${limit}`);
    },

    getById: async (id) => {
        return api.get(`/emails/${id}`);
    },

    search: async (query) => {
        return api.get(`/emails/search/${query}`);
    },

    getUnread: async () => {
        return api.get(`/emails/filter/unread`);
    },

    send: async (emailData) => {
        return api.post(`/emails/send`, emailData);
    },

    markRead: async (id, isRead) => {
        return api.put(`/emails/${id}/read`, { isRead });
    },

    toggleStar: async (id, isStarred) => {
        return api.put(`/emails/${id}/star`, { isStarred });
    },

    delete: async (id) => {
        return api.delete(`/emails/${id}`);
    },

    deleteAll: async () => {
        return api.delete(`/emails/all/reset`);
    }
};

// Sync
export const syncAPI = {
    syncAll: async () => {
        return api.post(`/sync/all`);
    },

    syncGmail: async () => {
        return api.post(`/sync/gmail`);
    },

    getStatus: async () => {
        return api.get(`/sync/status`);
    }
};

// AI Chat
export const chatAPI = {
    query: async (message) => {
        return api.post(`/chat/query`, { message });
    },
};

export { getToken, setToken, removeToken };