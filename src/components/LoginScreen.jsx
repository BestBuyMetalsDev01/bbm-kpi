import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';

const LoginScreen = () => {
    const { login, error } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md text-center animate-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                        <img
                            src={`${import.meta.env.BASE_URL}BBMLOGO.png`}
                            alt="BBM Logo"
                            className="h-12 w-auto"
                        />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Performance Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Authorized Access Only</p>

                <div className="flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={login}
                        onError={() => console.log('Login Failed')}
                        theme="filled_blue"
                        shape="pill"
                        size="large"
                    />
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 justify-center border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs uppercase tracking-widest font-bold">
                        <Shield className="w-3 h-3" />
                        <span>Secure Corporate Login</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
