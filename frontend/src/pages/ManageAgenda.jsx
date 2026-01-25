import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Calendar, MapPin, AlignLeft } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

const ManageAgenda = () => {
    const [agendas, setAgendas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', date: '', location: '', description: '' });
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchAgendas = async () => {
        try {
            const res = await api.get('/agenda/');
            setAgendas(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAgendas();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editId) {
                await api.put(`/agenda/${editId}`, formData);
            } else {
                await api.post('/agenda/', formData);
            }

            setFormData({ title: '', date: '', location: '', description: '' });
            setEditId(null);
            setIsModalOpen(false);
            fetchAgendas();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Error saving agenda');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/agenda/${id}`);
                fetchAgendas();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const openEdit = (a) => {
        setFormData({
            title: a.title,
            date: a.date,
            location: a.location || '',
            description: a.description || ''
        });
        setEditId(a.id);
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
                    <p className="text-gray-500">Manage school events and schedules</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setFormData({ title: '', date: '', location: '', description: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Agenda
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agendas.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold flex flex-col items-center leading-tight">
                                <span className="text-[10px] uppercase">{format(new Date(item.date), 'MMM')}</span>
                                <span className="text-xl">{format(new Date(item.date), 'dd')}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h3>

                        <div className="space-y-2 text-sm text-gray-600">
                            {item.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{item.location}</span>
                                </div>
                            )}
                            {item.description && (
                                <div className="flex items-start gap-2">
                                    <AlignLeft className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <p className="line-clamp-2">{item.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{editId ? 'Edit Agenda' : 'Add Agenda'}</h2>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? 'Update' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAgenda;
