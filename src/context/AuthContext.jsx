import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('bbm_kpi_user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Auth: Error parsing stored user:", error);
            return null;
        }
    });
    const [error, setError] = useState(null);

    // Sync user state to local storage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('bbm_kpi_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('bbm_kpi_user');
        }
    }, [user]);

    const login = (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            const userData = {
                email: decoded.email.toLowerCase(),
                name: decoded.name,
                picture: decoded.picture,
                id: decoded.sub
            };

            setUser(userData);
            setError(null);
        } catch (err) {
            console.error("Login Failed", err);
            setError("Login Failed. Please try again.");
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
