import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, Plus, Trash2, ShieldCheck, ShieldAlert, 
    RefreshCcw, Phone, User, CheckCircle2, XCircle, Loader2,
    QrCode, Smartphone, Info
} from 'lucide-react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const ManageWA = () => {
    const [numbers, setNumbers] = useState([]);
    const [status, setStatus] = useState({ status: 'LOADING', qr: null });
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ phone_number: '', name: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [numRes, statusRes] = await Promise.all([
                api.get('/wa-settings/numbers'),
                api.get('/wa-settings/status')
            ]);
            setNumbers(numRes.data);
            setStatus(statusRes.data);
        } catch (error) {
            console.error('Error fetching WA data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll status every 10s
        return () => clearInterval(interval);
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/wa-settings/numbers', formData);
            setFormData({ phone_number: '', name: '' });
            setShowAdd(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Gagal menambahkan nomor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus nomor ini dari daftar authorized?')) return;
        try {
            await api.delete(`/wa-settings/numbers/${id}`);
            fetchData();
        } catch (error) {
            alert('Gagal menghapus nomor');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl">
                            <MessageSquare className="w-8 h-8 text-green-600" />
                        </div>
                        WhatsApp Gateway
                    </h1>
                    <p className="text-gray-500 mt-1">Kelola integrasi pengiriman berita otomatis melalui WhatsApp.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                        title="Refresh Status"
                    >
                        <RefreshCcw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setShowAdd(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" /> Tambah Admin WA
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Connection Status & QR */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-500" /> Status Koneksi
                        </h3>

                        <div className="flex flex-col items-center text-center">
                            {status.status === 'CONNECTED' ? (
                                <div className="space-y-4 w-full">
                                    <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-green-600">Terhubung</p>
                                        <p className="text-gray-500 text-sm">Server WhatsApp aktif dan siap menerima berita.</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-2xl text-left border border-green-100">
                                        <div className="flex gap-3">
                                            <Info className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <p className="text-xs text-green-800 leading-relaxed">
                                                Gunakan format <strong>BERITA#JUDUL#ISI</strong> saat mengirim pesan ke nomor ini.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : status.status === 'DISCONNECTED' && status.qr ? (
                                <div className="space-y-6 w-full">
                                    <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                                        <XCircle className="w-12 h-12 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-red-600">Belum Terhubung</p>
                                        <p className="text-gray-500 text-sm mb-6">Scan QR Code berikut untuk menghubungkan perangkat.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mx-auto">
                                        <img src={status.qr} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                    <p className="text-[10px] text-gray-400">QR Code akan diperbarui otomatis setiap beberapa detik.</p>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                    <p className="text-gray-500 animate-pulse">Menghubungkan ke Gateway...</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Authorized Numbers Table */}
                <div className="lg:col-span-2">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-green-500" /> Admin Terdaftar
                            </h3>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500">
                                {numbers.length} Total
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                                        <th className="px-8 py-4">Nama / Identitas</th>
                                        <th className="px-8 py-4">Nomor WhatsApp</th>
                                        <th className="px-8 py-4 text-center">Status</th>
                                        <th className="px-8 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {numbers.map((num) => (
                                        <tr key={num.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                        {num.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-gray-800">{num.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium">+{num.phone_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${num.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {num.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button 
                                                    onClick={() => handleDelete(num.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {numbers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-12 text-center text-gray-400 italic">
                                                Belum ada nomor yang didaftarkan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 bg-green-600 text-white relative">
                                <button 
                                    onClick={() => setShowAdd(false)}
                                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                                >
                                    <RefreshCcw className="w-6 h-6 rotate-45" />
                                </button>
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                    <Smartphone className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black">Tambah Admin WA</h2>
                                <p className="text-white/80 text-sm mt-1">Daftarkan nomor untuk mengizinkan update berita.</p>
                            </div>

                            <form onSubmit={handleAdd} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nama Lengkap / Jabatan</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-bold"
                                            placeholder="Contoh: Pak Budi (Kesiswaan)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nomor HP (Gunakan Kode Negara)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="text"
                                            required
                                            value={formData.phone_number}
                                            onChange={e => setFormData({...formData, phone_number: e.target.value.replace(/[^0-9]/g, '')})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-bold"
                                            placeholder="Contoh: 628123456789"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 px-2">
                                        * Awali dengan <strong>62</strong> tanpa tanda + atau spasi.
                                    </p>
                                </div>

                                <button 
                                    disabled={isSubmitting}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Daftarkan Nomor'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageWA;
