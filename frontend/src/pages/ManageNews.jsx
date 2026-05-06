import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, User } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

const ManageNews = () => {
    const [news, setNews] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', is_pinned: false });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchNews = async () => {
        try {
            const res = await api.get('/news/');
            setNews(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('content', formData.content);
            data.append('is_pinned', formData.is_pinned);
            if (imageFile) {
                data.append('image', imageFile);
            }

            await api.post('/news/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFormData({ title: '', content: '', is_pinned: false });
            setImageFile(null);
            setIsModalOpen(false);
            fetchNews();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to post news");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/news/${id}`);
                fetchNews();
            } catch (err) {
                console.error(err);
                alert('Failed to delete');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Berita Sekolah</h1>
                    <p className="text-gray-500">Manage school news and announcements</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add News
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {news.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                {item.image_url && (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.image_url}`} alt={item.title} className="w-32 h-24 object-cover rounded-lg" />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                        {item.title}
                                        {item.is_pinned && (
                                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full border border-blue-200">
                                                Pinned
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-gray-600 mb-4 line-clamp-2">{item.content}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(item.date_posted), 'dd MMM yyyy')}</span>
                                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> Author ID: {item.author_id}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Add New News</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <input
                                    type="file"
                                    onChange={(e) => setImageFile(e.target.files[0])}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    accept="image/*"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPinned"
                                    checked={formData.is_pinned}
                                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">Pin News (Max 3 visible at top)</label>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Posting...' : 'Post News'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageNews;
