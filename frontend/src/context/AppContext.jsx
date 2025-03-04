import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from 'axios';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const currencySymbol = '₱';
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [doctors, setDoctors] = useState([]);
    const [userData, setUserData] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loginState, setLoginState] = useState('Sign Up');

    // Initialize token from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(`Bearer ${storedToken}`);
        }
    }, []);

    // Configure axios defaults when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = token;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const addNotification = (message) => {
        const newNotification = {
            id: Date.now(),
            message,
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const markNotificationAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId 
                    ? { ...notif, read: true }
                    : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllNotificationsAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken('');
        setUserData(false);
        setNotifications([]);
        setUnreadCount(0);
    };

    // Getting Doctors using API
    const getDoctorsData = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
            if (data.success) {
                setDoctors(data.doctors);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Getting User Profile using API
    const loadUserProfileData = async () => {
        if (!token) return;
        
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/get-profile`);

            if (data.success) {
                setUserData(data.userData);
            } else {
                toast.error(data.message);
                if (data.message.toLowerCase().includes('auth')) {
                    handleLogout();
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        getDoctorsData();
    }, []);

    useEffect(() => {
        if (token) {
            loadUserProfileData();
        } else {
            setUserData(false);
        }
    }, [token]);

    const contextValue = {
        currencySymbol,
        backendUrl,
        doctors,
        token,
        setToken,
        userData,
        setUserData,
        handleLogout,
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        loginState,
        setLoginState
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
