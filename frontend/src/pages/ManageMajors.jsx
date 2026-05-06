import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Bookmark } from 'lucide-react';
import api from '../api';

const ManageMajors = () => {
    const [majors, setMajors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', logo: null });
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchMajors = async () => {
        try {
            const res = await api.get('/majors/');
            setMajors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMajors();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            if (formData.logo) {
                data.append('logo', formData.logo);
            }

            // Note: Content-Type header is automatically set by browser/axios when sending FormData
            if (editId) {
                await api.put(`/majors/${editId}`, data);
            } else {
                await api.post('/majors/', data);
            }

            setFormData({ name: '', description: '', logo: null });
            setEditId(null);
            setIsModalOpen(false);
            fetchMajors();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Error adding/updating major');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/majors/${id}`);
                fetchMajors();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Jurusan</h1>
                    <p className="text-gray-500">Manage academic majors</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Major
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {majors.map((major) => (
                    <div key={major.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-3 bg-pink-50 rounded-lg overflow-hidden w-12 h-12 flex items-center justify-center">
                                {major.logo_url ? (
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${major.logo_url}`} alt={major.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Bookmark className="w-6 h-6 text-pink-500" />
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setFormData({ name: major.name, description: major.description, logo: null });
                                        setEditId(major.id);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(major.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{major.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-3">{major.description}</p>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Major' : 'Add New Major'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Major Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 h-24"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, logo: e.target.files[0] })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    accept="image/*"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditId(null); setFormData({ name: '', description: '', logo: null }); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">{editId ? 'Update' : 'Add'} Major</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMajors;
