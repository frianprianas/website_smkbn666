import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Star, User } from 'lucide-react';
import api from '../api';

const ManageTestimonials = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', role: '', content: '', rating: 5, image: null });
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTestimonials = async () => {
        try {
            const res = await api.get('/testimonials/');
            setTestimonials(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('role', formData.role);
            data.append('content', formData.content);
            data.append('rating', formData.rating);
            if (formData.image) {
                data.append('image', formData.image);
            }

            if (editId) {
                await api.put(`/testimonials/${editId}`, data);
            } else {
                await api.post('/testimonials/', data);
            }

            setFormData({ name: '', role: '', content: '', rating: 5, image: null });
            setEditId(null);
            setIsModalOpen(false);
            fetchTestimonials();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Error saving testimonial');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/testimonials/${id}`);
                fetchTestimonials();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const openEdit = (t) => {
        setFormData({
            name: t.name,
            role: t.role,
            content: t.content,
            rating: t.rating,
            image: null
        });
        setEditId(t.id);
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Testimonials</h1>
                    <p className="text-gray-500">Manage alumni/partner testimonials</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setFormData({ name: '', role: '', content: '', rating: 5, image: null });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Testimonial
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                    <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                {t.image_url ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${t.image_url}`} alt={t.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{t.name}</h3>
                                <p className="text-xs text-blue-500 font-bold uppercase">{t.role}</p>
                                <div className="flex gap-0.5 text-orange-400 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-current' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm italic mb-4 line-clamp-4">"{t.content}"</p>

                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="e.g. Alumni RPL 2023"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 h-24"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                <select
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                >
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    accept="image/*"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">{editId ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTestimonials;
