import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Calendar, User, ArrowRight, Search, Tag, 
    Filter, Newspaper, Clock, ArrowLeft, ChevronRight,
    LayoutGrid, List as ListIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    const categories = ['Semua', 'Berita Utama', 'Berita Harian', 'Pengumuman', 'Prestasi'];

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/news/`);
                // Sort by date descending
                const sortedNews = response.data.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
                setNews(sortedNews);
                setFilteredNews(sortedNews);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    useEffect(() => {
        let result = news;

        // Filter by category
        if (activeCategory !== 'Semua') {
            result = result.filter(item => 
                (item.category || 'Umum').toLowerCase() === activeCategory.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery) {
            result = result.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredNews(result);
    }, [searchQuery, activeCategory, news]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Memuat Kabar Baknus...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-500 selection:text-white">
            {/* --- Hero Section --- */}
            <div className="relative py-20 md:py-32 bg-blue-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
                </div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                            KABAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-200">BAKNUS 666</span>
                        </h1>
                        <p className="text-blue-100/70 max-w-2xl mx-auto text-lg md:text-xl font-light">
                            Informasi terkini, pengumuman resmi, dan prestasi gemilang dari seluruh ekosistem SMK Bakti Nusantara 666.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* --- Filter & Search Section --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-blue-50 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        {/* Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                        activeCategory === cat 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search & View Toggle */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari berita..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                                />
                            </div>
                            <div className="hidden sm:flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                                >
                                    <ListIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- News Grid/List Section --- */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <AnimatePresence mode='wait'>
                    {filteredNews.length > 0 ? (
                        <motion.div 
                            key={activeCategory + searchQuery + viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={viewMode === 'grid' 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                                : "space-y-6 max-w-5xl mx-auto"
                            }
                        >
                            {filteredNews.map((item, idx) => (
                                <NewsCard key={item.id} item={item} mode={viewMode} index={idx} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200"
                        >
                            <Newspaper className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada berita ditemukan</h3>
                            <p className="text-gray-500">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
                            <button 
                                onClick={() => {setSearchQuery(''); setActiveCategory('Semua');}}
                                className="mt-6 text-blue-600 font-bold hover:underline"
                            >
                                Reset Pencarian
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- Footer Accent --- */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Newspaper className="w-40 h-40" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 relative z-10">Tetap Terhubung dengan Kami</h2>
                    <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10 text-lg">
                        Dapatkan update berita otomatis melalui sistem WhatsApp kami atau ikuti media sosial resmi sekolah.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-all shadow-lg">
                            Hubungi Kami
                        </button>
                        <button className="bg-blue-500/30 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-500/40 transition-all">
                            Ikuti Instagram
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewsCard = ({ item, mode, index }) => {
    const isGrid = mode === 'grid';
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 flex ${isGrid ? 'flex-col' : 'flex-col md:flex-row h-auto md:h-64'}`}
        >
            {/* Image Section */}
            <div className={`relative overflow-hidden shrink-0 ${isGrid ? 'h-56' : 'h-56 md:h-full md:w-80'}`}>
                {item.image_url ? (
                    <img 
                        src={`${API_URL}${item.image_url}`} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Tag className="w-12 h-12 text-slate-300" />
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider">
                        {item.category || 'Umum'}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            {format(new Date(item.date_posted), 'd MMM yyyy', { locale: id })}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-blue-500" />
                            Redaksi
                        </div>
                    </div>
                    <Link to={`/news/${item.id}`}>
                        <h3 className={`font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-3 ${isGrid ? 'text-xl line-clamp-2' : 'text-2xl line-clamp-2'}`}>
                            {item.title}
                        </h3>
                    </Link>
                    <p className={`text-gray-500 leading-relaxed font-light ${isGrid ? 'text-sm line-clamp-3 mb-6' : 'text-base line-clamp-2 mb-6'}`}>
                        {item.content}
                    </p>
                </div>
                
                <Link 
                    to={`/news/${item.id}`} 
                    className="inline-flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-tighter hover:gap-4 transition-all"
                >
                    Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </motion.div>
    );
};

export default NewsPage;
