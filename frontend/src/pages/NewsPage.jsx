import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { 
    Calendar, User, ArrowRight, Search, Tag, 
    Newspaper, ArrowLeft, LayoutGrid, List as ListIcon,
    Globe, Bot
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const NewsPage = () => {
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'Semua';

    const [allNews, setAllNews] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [viewMode, setViewMode] = useState('grid');

    const categories = ['Semua', 'Berita Utama', 'Berita Harian', 'Kabar AI', 'Pengumuman', 'Prestasi'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both sources
                const [internalRes, aiRes] = await Promise.all([
                    api.get('/news'),
                    api.get('/kabar-baknus')
                ]);

                // Normalize AI News to match Internal News structure for display
                const normalizedAI = aiRes.data.map(item => ({
                    ...item,
                    category: 'Kabar AI',
                    date_posted: item.date_found,
                    content: item.summary,
                    is_ai: true // Flag to handle different link behavior
                }));

                const combined = [...internalRes.data, ...normalizedAI].sort((a, b) => 
                    new Date(b.date_posted) - new Date(a.date_posted)
                );

                setAllNews(combined);
                setFilteredNews(combined);
                
                // If there's a category in URL, apply it
                if (initialCategory !== 'Semua') {
                    const filtered = combined.filter(n => n.category === initialCategory);
                    setFilteredNews(filtered);
                }
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [initialCategory]);

    useEffect(() => {
        let result = allNews;

        if (activeCategory !== 'Semua') {
            result = result.filter(item => item.category === activeCategory);
        }

        if (searchQuery) {
            result = result.filter(item => 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredNews(result);
    }, [searchQuery, activeCategory, allNews]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium">Menyinkronkan Berita...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-500 selection:text-white">
            {/* --- Hero Section --- */}
            <div className="relative py-20 md:py-32 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-white"
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm">
                            <ArrowLeft className="w-4 h-4" /> Beranda
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                            PORTAL <span className="text-blue-500">BERITA</span>
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl font-light">
                            Pusat informasi terpadu SMK Bakti Nusantara 666, menggabungkan rilis resmi sekolah dan update teknologi terkini dari BaknusAI.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* --- Filter & Search Section --- */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-blue-50 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
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

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Cari berita..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- News Grid --- */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <AnimatePresence mode='wait'>
                    {filteredNews.length > 0 ? (
                        <motion.div 
                            key={activeCategory + searchQuery}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {filteredNews.map((item, idx) => (
                                <NewsCard key={item.id + (item.is_ai ? '-ai' : '')} item={item} index={idx} />
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                            <Newspaper className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada berita di kategori ini</h3>
                            <button onClick={() => setActiveCategory('Semua')} className="text-blue-600 font-bold hover:underline">Lihat Semua Berita</button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const NewsCard = ({ item, index }) => {
    const isAI = item.is_ai;
    const date = item.date_posted || item.date_found;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
        >
            <div className="relative h-56 overflow-hidden shrink-0">
                <img 
                    src={isAI ? (item.image_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800") : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.image_url}`} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800" }}
                />
                <div className="absolute top-4 left-4">
                    <span className={`${isAI ? 'bg-indigo-600' : 'bg-blue-600'} text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider flex items-center gap-1.5`}>
                        {isAI && <Bot className="w-3 h-3" />}
                        {item.category}
                    </span>
                </div>
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            {format(new Date(date), 'd MMM yyyy', { locale: id })}
                        </div>
                        {isAI ? (
                            <div className="flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-indigo-500" />
                                {item.source_name}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-blue-500" />
                                Redaksi
                            </div>
                        )}
                    </div>
                    
                    {isAI ? (
                        <a href={item.source_link} target="_blank" rel="noreferrer">
                            <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight mb-3 text-xl line-clamp-2">
                                {item.title}
                            </h3>
                        </a>
                    ) : (
                        <Link to={`/news/${item.id}`}>
                            <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-3 text-xl line-clamp-2">
                                {item.title}
                            </h3>
                        </Link>
                    )}
                    
                    <p className="text-gray-500 leading-relaxed font-light text-sm line-clamp-3 mb-6">
                        {item.content}
                    </p>
                </div>
                
                {isAI ? (
                    <a 
                        href={item.source_link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-tighter hover:gap-4 transition-all"
                    >
                        Baca Sumber Asli <ArrowRight className="w-4 h-4" />
                    </a>
                ) : (
                    <Link 
                        to={`/news/${item.id}`} 
                        className="inline-flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-tighter hover:gap-4 transition-all"
                    >
                        Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
        </motion.div>
    );
};

export default NewsPage;
