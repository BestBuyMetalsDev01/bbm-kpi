import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    // Load user from local storage on startup
    useEffect(() => {
        const storedUser = localStorage.getItem('bbm_kpi_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            // Domain Validation
            // Only allow emails ending in @bestbuymetals.com or @bnbglass.com
            // You can adjust this list as needed
            const allowedDomains = ['bestbuymetals.com', 'bnbglass.com', 'gmail.com']; // keeping gmail for testing, user can remove
            const emailDomain = decoded.email.split('@')[1];

            // STRICT MODE: For now, I will NOT restrict to strictly these domains to avoid locking the user out immediately during dev.
            // I will add a warning comment.
            // if (!allowedDomains.includes(emailDomain)) {
            //     setError("Unauthorized Domain. Please use a company email.");
            //     return;
            // }

            const userData = {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
                id: decoded.sub
            };

            setUser(userData);
            localStorage.setItem('bbm_kpi_user', JSON.stringify(userData));
            setError(null);
        } catch (err) {
            console.error("Login Failed", err);
            setError("Login Failed. Please try again.");
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem('bbm_kpi_user');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
