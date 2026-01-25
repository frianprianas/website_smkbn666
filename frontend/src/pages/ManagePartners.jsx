import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Building2 } from 'lucide-react';
import api from '../api';

const ManagePartners = () => {
    const [partners, setPartners] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPartners = async () => {
        try {
            const res = await api.get('/partners/');
            setPartners(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPartners();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', name);
            if (logo) {
                data.append('logo', logo);
            }

            await api.post('/partners/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setName('');
            setLogo(null);
            setIsModalOpen(false);
            fetchPartners();
        } catch (err) {
            console.error(err);
            alert("Failed to add partner");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/partners/${id}`);
                fetchPartners();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Mitra Industri</h1>
                    <p className="text-gray-500">Manage industry partners and companies</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Partner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {partners.map((partner) => (
                    <div key={partner.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 group hover:shadow-md transition-all relative">
                        <button
                            onClick={() => handleDelete(partner.id)}
                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-32 h-32 flex items-center justify-center p-2">
                            <img src={`http://localhost:8000${partner.logo_url}`} alt={partner.name} className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300" />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-center">{partner.name}</h3>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add New Partner</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative">
                                    <Building2 className="w-8 h-8 mb-2" />
                                    <span className="text-sm">{logo ? logo.name : "Upload Logo"}</span>
                                    <input
                                        type="file"
                                        onChange={(e) => setLogo(e.target.files[0])}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Partner</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePartners;
