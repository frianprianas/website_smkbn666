import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Plus, Trash2, Save, Power, Globe, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

const ManageAIBot = () => {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newSource, setNewSource] = useState({ name: '', rss_url: '', is_active: true });

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/ai-bot/sources`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSources(response.data);
        } catch (error) {
            toast.error('Gagal mengambil data sumber berita');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSource = async (e) => {
        e.preventDefault();
        if (sources.length >= 5) {
            toast.error('Maksimal 5 sumber berita diperbolehkan');
            return;
        }

        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/ai-bot/sources`, newSource, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Sumber berita berhasil ditambahkan');
            setNewSource({ name: '', rss_url: '', is_active: true });
            fetchSources();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menambahkan sumber');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (source) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/ai-bot/sources/${source.id}`, 
                { ...source, is_active: !source.is_active },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchSources();
            toast.success('Status berhasil diperbarui');
        } catch (error) {
            toast.error('Gagal memperbarui status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus sumber ini?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/ai-bot/sources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Sumber berhasil dihapus');
            fetchSources();
        } catch (error) {
            toast.error('Gagal menghapus sumber');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header title="Auto Kontributor by BaknusAi" />
                <main className="p-8">
                    {/* Intro Section */}
                    <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                                <Bot className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">BaknusAi Configuration</h2>
                                <p className="text-blue-100">Otomasi konten berita cerdas berbasis Gemini AI</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <h3 className="font-semibold mb-1">Rotasi Harian</h3>
                                <p className="text-sm text-blue-50">Sistem akan mengambil satu sumber secara acak setiap hari untuk menjaga variasi.</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <h3 className="font-semibold mb-1">Narasi Relevan</h3>
                                <p className="text-sm text-blue-50">AI akan mengajak siswa-siswi Bakti Nusantara 666 berpartisipasi dalam konteks berita.</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <h3 className="font-semibold mb-1">Visualisasi Cerdas</h3>
                                <p className="text-sm text-blue-50">Setiap berita akan dilengkapi ilustrasi digital yang dihasilkan oleh Gemini Image.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Section */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-500" />
                                    Tambah Sumber RSS
                                </h3>
                                <form onSubmit={handleAddSource} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Media</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: Detik Teknologi"
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={newSource.name}
                                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL RSS Feed</label>
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://example.com/rss"
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={newSource.rss_url}
                                            onChange={(e) => setNewSource({ ...newSource, rss_url: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSaving || sources.length >= 5}
                                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {isSaving ? 'Menyimpan...' : 'Simpan Sumber'}
                                    </button>
                                    {sources.length >= 5 && (
                                        <p className="text-xs text-red-500 text-center italic">Batas maksimal 5 sumber tercapai.</p>
                                    )}
                                </form>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-800">Daftar Sumber Aktif ({sources.length}/5)</h3>
                                    <button 
                                        onClick={fetchSources}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                        title="Refresh"
                                    >
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {loading ? (
                                        <div className="p-12 text-center text-gray-400">Memuat data...</div>
                                    ) : sources.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <Globe className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                            <p className="text-gray-400">Belum ada sumber berita yang dikonfigurasi.</p>
                                        </div>
                                    ) : (
                                        sources.map((source) => (
                                            <div key={source.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${source.is_active ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{source.name}</h4>
                                                        <p className="text-sm text-gray-500 truncate max-w-xs">{source.rss_url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(source)}
                                                        className={`p-2 rounded-lg transition-all ${source.is_active ? 'text-green-500 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
                                                        title={source.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    >
                                                        <Power className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(source.id)}
                                                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageAIBot;
