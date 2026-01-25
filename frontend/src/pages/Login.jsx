import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { School, User, Lock, Loader2 } from 'lucide-react';
import api from '../api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/token', formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);

            // Get user role and permissions
            const userRes = await api.get('/users/me');
            localStorage.setItem('role', userRes.data.role);
            localStorage.setItem('permissions', userRes.data.permissions || "");

            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Left Side - Brand with Image Background */}
            <div className="hidden md:flex flex-col justify-center items-center bg-blue-600 text-white p-12 relative overflow-hidden">
                {/* Background Image Overlay */}
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('/images/new-school-building.jpg')` }}
                />
                {/* Lighter overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-indigo-900/60 backdrop-blur-[1px]"></div>

                <div className="relative z-10 text-center">
                    <div className="mb-6 inline-flex p-4 bg-white/20 rounded-full backdrop-blur-md border border-white/20 shadow-2xl">
                        <img src="/images/logo-school.png" alt="Logo" className="w-20 h-20 object-contain drop-shadow-md" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight drop-shadow-lg text-white">SMK Bakti Nusantara 666</h1>
                    <p className="text-blue-50 text-lg drop-shadow-md font-medium">Professional School Management System</p>
                </div>

                {/* Abstract shapes */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-12 right-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8 md:hidden">
                        <img src="/images/logo-school.png" alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                        <h2 className="text-2xl font-bold text-gray-800">SMK Bakti Nusantara 666</h2>
                    </div>

                    <div className="mb-6">
                        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
                            ← Back to Website
                        </Link>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
                        <p className="text-gray-500 mb-8">Please sign in to your account</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
