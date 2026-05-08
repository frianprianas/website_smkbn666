import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, User, ArrowLeft, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const NewsDetail = () => {
    const { id: newsId } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
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
                        <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl">
                            <video 
                                src={`${API_URL}${news.video_url}`} 
                                controls 
                                className="w-full aspect-video object-cover"
                            />
                        </div>
                    )}
                    
                    {/* Render content with line breaks */}
                    {news.content.split('\n').map((paragraph, i) => (
                        paragraph.trim() ? <p key={i} className="mb-6">{paragraph}</p> : <br key={i} />
                    ))}
                </div>

                {/* Footer Article */}
                <div className="mt-20 p-8 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-900 mb-1">Bagikan Berita Ini</h4>
                        <p className="text-sm text-gray-500">Ayo sebarkan informasi positif dari sekolah kita.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Simple Social Share Buttons could go here */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetail;
