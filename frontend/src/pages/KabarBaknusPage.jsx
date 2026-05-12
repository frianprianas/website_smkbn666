import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ExternalLink, ArrowLeft, Newspaper, 
    Calendar, Globe, Search, ArrowRight, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const KabarBaknusPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await api.get('/kabar-baknus');
                setNews(response.data.reverse()); // Newest first
            } catch (error) {
                console.error('Error fetching Kabar Baknus:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const filteredNews = news.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-indigo-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-indigo-600 font-bold animate-pulse">Menghubungkan ke BaknusAI...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* --- Hero Header --- */}
            <div className="bg-indigo-900 pt-32 pb-20 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-indigo-200 hover:text-white mb-8 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-sm transition-all border border-white/10">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <Bot className="w-8 h-8 text-indigo-300" />
                            <span className="text-indigo-300 font-black tracking-widest uppercase text-sm">Baknus AI Intelligence</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6">
                            KABAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">BAKNUS AI</span>
                        </h1>
                        <p className="text-indigo-100/70 max-w-2xl text-lg md:text-xl font-light leading-relaxed">
                            Rangkuman berita teknologi, pendidikan, dan informasi global yang dikurasi secara otomatis oleh kecerdasan buatan untuk civitas SMK Bakti Nusantara 666.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* --- Search & Stats Bar --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                <div className="bg-white rounded-[2rem] shadow-xl border border-indigo-50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Newspaper className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Koleksi</p>
                            <p className="text-xl font-black text-gray-900">{news.length} Artikel Berita</p>
                        </div>
                    </div>
                    
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Cari topik atau sumber berita..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* --- News List --- */}
            <div className="max-w-5xl mx-auto px-6 py-20">
                {filteredNews.length > 0 ? (
                    <div className="space-y-8">
                        {filteredNews.map((item, idx) => (
                            <motion.a
                                key={item.id}
                                href={item.source_link}
                                target="_blank"
                                rel="noreferrer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex flex-col md:flex-row gap-6 bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-indigo-200 hover:shadow-2xl transition-all duration-500"
                            >
                                <div className="w-full md:w-64 h-48 rounded-3xl overflow-hidden shrink-0 bg-indigo-50 relative">
                                    {item.image_url ? (
                                        <img 
                                            src={item.image_url} 
                                            alt={item.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Globe className="w-12 h-12 text-indigo-200" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-indigo-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider">
                                            {item.source_name}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                                        <Calendar className="w-3 h-3 text-indigo-500" />
                                        {new Date(item.date_found).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 font-light">
                                        {item.summary}
                                    </p>
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-tighter group-hover:gap-4 transition-all">
                                        Baca Sumber Lengkap <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                        <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Pencarian Nihil</h3>
                        <p className="text-gray-500 text-sm">Bot AI kami belum menemukan berita dengan kata kunci tersebut.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KabarBaknusPage;
