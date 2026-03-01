import { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';

const AuthContext = createContext();

// Create axios instance
const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if exists
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Validate token with backend
            API.get('/auth/me')
                .then(response => {
                    if (response.data.success) {
                        setUser(response.data.user);
                        setIsLoggedIn(true);
                    }
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const registerDonor = async (formData) => {
        try {
            console.log('Sending to backend:', JSON.stringify(formData, null, 2));
            
            const response = await API.post('/auth/register/donor', formData);
            
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                setUser(response.data.user);
                setIsLoggedIn(true);
                return { success: true, data: response.data };
            }
        } catch (error) {
            console.error('Full error response:', error.response);
            console.error('Error data:', error.response?.data);
            
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.map(e => `${e.param}: ${e.msg}`).join('\n');
                return { success: false, message: errorMessages };
            }
            
            if (error.response?.data?.error) {
                return { success: false, message: error.response.data.error };
            }
            
            return { 
                success: false, 
                message: error.response?.data?.message || 'Registration failed' 
            };
        }
    };

    const login = async (email, password, isAdmin = false) => {
        try {
            console.log('AuthContext login called with:', { email, isAdmin });
            
            const response = await API.post('/auth/login', {
                email,
                password,
                isAdmin
            });
            
            console.log('Login response:', response.data);
            
            if (response.data.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setUser(user);
                setIsLoggedIn(true);
                return { success: true, user };
            }
        } catch (error) {
            console.error('AuthContext login error:', error);
            console.error('Error response:', error.response?.data);
            
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed. Please try again.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ 
            isLoggedIn, 
            user, 
            login,
            registerDonor,
            logout,
            loading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);