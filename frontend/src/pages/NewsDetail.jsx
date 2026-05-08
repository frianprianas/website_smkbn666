import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Calendar, User, ArrowLeft, Clock, Tag, X, Lock, LogIn, 
    ShieldCheck, AlertCircle, Loader2, MessageSquare, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NewsDetail = () => {
    const { id: newsId } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    const fetchNews = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/news/${newsId}`);
            setNews(response.data);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        window.scrollTo(0, 0);
    }, [newsId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!news) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Berita tidak ditemukan</h2>
            <Link to="/" className="text-blue-600 flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" /> Kembali ke Beranda
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <AnimatePresence>
                {isLoginModalOpen && (
                    <LoginModal 
                        onClose={() => setIsLoginModalOpen(false)} 
                        onSuccess={() => {
                            setIsLoggedIn(true);
                            setIsLoginModalOpen(false);
                            fetchNews();
                        }} 
                    />
                )}
            </AnimatePresence>

            {/* Header / Hero Image */}
            <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden">
                {news.image_url ? (
                    <img 
                        src={`${API_URL}${news.image_url}`} 
                        alt={news.title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center">
                        <Tag className="w-32 h-32 text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                    <div className="max-w-4xl mx-auto">
                        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm">
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {news.category || 'Berita Utama'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                            {news.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <div className="flex flex-wrap items-center gap-6 pb-8 mb-12 border-b border-gray-100 text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">{format(new Date(news.date_posted), 'eeee, d MMMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">Redaksi SMK Bakti Nusantara 666</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">Dibaca {Math.ceil(news.content.length / 500)} Menit</span>
                    </div>
                </div>

                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-blue">
                    {news.video_url && (
                        <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl bg-black">
                            <video 
                                src={`${API_URL}${news.video_url}`} 
                                controls 
                                className="w-full aspect-video object-cover"
                            />
                        </div>
                    )}
                    
                    {news.content.split('\n').map((paragraph, i) => (
                        paragraph.trim() ? <p key={i} className="mb-6">{paragraph}</p> : <br key={i} />
                    ))}
                </div>

                {/* --- SEKSI KOMENTAR --- */}
                <div className="mt-20 pt-10 border-t border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        Diskusi & Komentar <span className="bg-blue-100 text-blue-600 px-3 py-0.5 rounded-full text-sm">{news.comments?.length || 0}</span>
                    </h3>

                    {isLoggedIn ? (
                        <CommentForm newsId={newsId} onCommentPosted={fetchNews} />
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-12 rounded-[2rem] text-center border border-blue-100 mb-12 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <MessageSquare className="w-32 h-32 text-blue-600" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl font-bold text-blue-900 mb-3 text-center">Ingin ikut berdiskusi?</h4>
                                <p className="text-blue-700/70 text-sm mb-8 max-w-md mx-auto text-center">Silakan login cepat menggunakan akun Mailcow (Siswa/Guru/Staff) Anda untuk memberikan komentar.</p>
                                <button 
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2 mx-auto"
                                >
                                    <LogIn className="w-5 h-5" /> Login Cepat
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-8">
                        {news.comments && news.comments.length > 0 ? (
                            news.comments.map((comment, idx) => (
                                <motion.div 
                                    key={comment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-4 md:gap-6 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg text-xl">
                                        {comment.user.username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h5 className="font-bold text-gray-900 text-lg">{comment.user.username}</h5>
                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{comment.user.role}</span>
                                            <span className="text-xs text-gray-400">{format(new Date(comment.date_posted), 'd MMM yyyy, HH:mm')}</span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">{comment.content}</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 italic text-sm md:text-base px-6 text-center">Belum ada diskusi. Jadilah yang pertama memberikan pendapat!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- QUICK LOGIN MODAL COMPONENT ---
const LoginModal = ({ onClose, onSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await axios.post(`${API_URL}/api/token`, formData);
            localStorage.setItem('token', response.data.access_token);
            onSuccess();
        } catch (err) {
            setError('Login gagal. Periksa kembali akun Mailcow Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10">
                    <X className="w-6 h-6 text-gray-400" />
                </button>

                <div className="p-8 md:p-12">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/40 mb-4 rotate-3">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">Quick Login</h2>
                        <p className="text-gray-500 text-sm">Gunakan akun Mailcow sekolah Anda</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-4">Username / Email</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                placeholder="nama@smkbaktinusantara666.sch.id"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-4">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 mt-4 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                            {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                        </button>
                    </form>
                </div>
                
                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Santun • Jujur • Taat</p>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- COMMENT FORM COMPONENT ---
const CommentForm = ({ newsId, onCommentPosted }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/comments/`, 
                { content, news_id: parseInt(newsId) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setContent('');
            onCommentPosted();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Gagal mengirim komentar. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-12">
            <div className="relative group">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tulis pendapat atau pertanyaanmu..."
                    className="w-full p-8 rounded-[2rem] bg-white border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-gray-700 min-h-[150px] shadow-sm group-hover:shadow-md"
                    required
                ></textarea>
                <div className="absolute bottom-6 right-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
                    >
                        {isSubmitting ? 'Mengirim...' : 'Kirim'}
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </form>
    );
};

export default NewsDetail;
