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

// Request interceptor for api calls => security guard that checks each API request and adds something if needed.
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)
// Response interceptor for API calls =>  checker that looks at the server’s reply before your code receives it.
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        if(error.response && error.response.status === 401) {
            // Handle unauthorized access - e.g., logout user, redirect to login page, etc.
            removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
)

// auth api
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
}

export { getToken, setToken, removeToken };