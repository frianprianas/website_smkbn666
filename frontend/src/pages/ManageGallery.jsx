import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Image } from 'lucide-react';
import api from '../api';

const ManageGallery = () => {
    const [gallery, setGallery] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchGallery = async () => {
        try {
            const res = await api.get('/gallery/');
            setGallery(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            if (formData.title) data.append('title', formData.title);
            if (formData.description) data.append('description', formData.description);
            if (imageFile) {
                data.append('image', imageFile);
            }

            await api.post('/gallery/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFormData({ title: '', description: '' });
            setImageFile(null);
            setIsModalOpen(false);
            fetchGallery();
        } catch (err) {
            console.error(err);
            alert("Failed to upload image.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            try {
                await api.delete(`/gallery/${id}`);
                fetchGallery();
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
                    <h1 className="text-2xl font-bold text-gray-800">Galeri Sekolah</h1>
                    <p className="text-gray-500">Manage school gallery images</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Image
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {gallery.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative h-48">
                            <img src={`http://localhost:8000${item.image_url}`} alt={item.title || "Gallery"} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-800 mb-1">{item.title || "Untitled"}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add New Image</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image (Required)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative">
                                    <Image className="w-8 h-8 mb-2" />
                                    <span className="text-sm">{imageFile ? imageFile.name : "Click to upload image"}</span>
                                    <input
                                        type="file"
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                    placeholder="Optional"
                                />
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
                                    {loading ? 'Uploading...' : 'Upload Image'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageGallery;
