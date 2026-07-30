import * as SecureStore from 'expo-secure-store';
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type {User} from '../types/index';
import {storage} from '../utils/storage';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const storedToken = await storage.getItem('token');
                const storedUser = await storage.getItem('user');

                if (storedToken && storedUser) {
                   setToken(storedToken);
                     setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error loading auth data:', error);
                await storage.deleteItem('token');
                await storage.deleteItem('user');
            }
            setLoading(false);

        };
        loadAuthData();
    }, []);

    const login = React.useMemo(() => {
        return async (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        await storage.setItem('token', newToken);
        await storage.setItem('user', JSON.stringify(newUser));
        };
    }, []);


    const logout = React.useMemo(() => {
        return async () => {
        setToken(null);
        setUser(null);
        await storage.deleteItem('token');
        await storage.deleteItem('user');
        };
    }, []);

    const isAuthenticated = token !== null;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider
        value={{ token, user, isAuthenticated, isAdmin, login, logout, loading }}
        >
        {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};