import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Image as ImageIcon, ArrowLeft, Maximize2, 
    Calendar, Tag, Search, X, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const GalleryPage = () => {
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/gallery/`);
                setGallery(response.data.reverse()); // Show newest first
            } catch (error) {
                console.error('Error fetching gallery:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const filteredGallery = gallery.filter(item => 
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Membuka Album Kenangan...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* --- Hero Section --- */}
            <div className="bg-white border-b border-gray-100 pt-32 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/50 skew-x-12 translate-x-20"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-bold bg-blue-50 px-5 py-2 rounded-full text-sm transition-all">
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
                            GALERI <span className="text-blue-600">AKTIVITAS</span>
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg md:text-xl">
                            Kumpulan momen berharga, prestasi, dan keceriaan seluruh civitas akademika SMK Bakti Nusantara 666.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* --- Filter Bar --- */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-gray-800 font-bold">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <span>{filteredGallery.length} Foto Ditemukan</span>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Cari momen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-6 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* --- Gallery Grid --- */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {filteredGallery.length > 0 ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                        {filteredGallery.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="relative group break-inside-avoid rounded-3xl overflow-hidden cursor-pointer bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
                                onClick={() => setSelectedImage(item)}
                            >
                                <img 
                                    src={`${API_URL}${item.image_url}`} 
                                    alt={item.title}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end">
                                    <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                                    <p className="text-white/70 text-sm line-clamp-2 mb-4">{item.description}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white">
                                            <Maximize2 className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Album masih kosong</h3>
                        <p className="text-gray-500">Belum ada foto yang sesuai dengan pencarian Anda.</p>
                    </div>
                )}
            </div>

            {/* --- Lightbox Modal --- */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                    >
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative max-w-5xl w-full flex flex-col md:flex-row gap-8 items-center">
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="flex-1 rounded-3xl overflow-hidden shadow-2xl bg-black flex items-center justify-center"
                            >
                                <img 
                                    src={`${API_URL}${selectedImage.image_url}`} 
                                    alt={selectedImage.title}
                                    className="max-h-[80vh] w-auto object-contain"
                                />
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full md:w-80 text-white"
                            >
                                <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                                    <Tag className="w-3 h-3" /> Galeri Sekolah
                                </div>
                                <h2 className="text-2xl font-black mb-4">{selectedImage.title}</h2>
                                <p className="text-white/60 text-sm leading-relaxed mb-8">
                                    {selectedImage.description}
                                </p>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-white/40 text-xs">
                                        <Calendar className="w-4 h-4" />
                                        Momen Terabadikan
                                    </div>
                                    <a 
                                        href={`${API_URL}${selectedImage.image_url}`}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/30"
                                    >
                                        <Download className="w-5 h-5" /> Download Gambar
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GalleryPage;
