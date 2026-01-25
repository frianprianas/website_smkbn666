import React, { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import api from '../api';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ nipy: '', name: '', position: '', description: '' });
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/staff/teachers/');
            setTeachers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('nipy', formData.nipy);
            data.append('name', formData.name);
            data.append('position', formData.position);
            if (formData.description) data.append('description', formData.description);
            if (photo) {
                data.append('photo', photo);
            }

            await api.post('/staff/teachers/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ nipy: '', name: '', position: '', description: '' });
            setPhoto(null);
            setIsModalOpen(false);
            fetchTeachers();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to add teacher");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await api.delete(`/staff/teachers/${id}`);
                fetchTeachers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Guru</h1>
                    <p className="text-gray-500">Manage teaching staff (NIPY, Nama, Jabatan, Keterangan)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Teacher
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600">Photo</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">NIPY</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Nama</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Jabatan</th>
                            <th className="px-6 py-4 font-semibold text-gray-600">Keterangan</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {teachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    {teacher.photo_url ? (
                                        <img src={`http://localhost:8000${teacher.photo_url}`} alt={teacher.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">?</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{teacher.nipy || "-"}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{teacher.name}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    <span className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-400" />
                                        {teacher.position}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">{teacher.description || "-"}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(teacher.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Add New Teacher</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIPY (Unique)</label>
                                <input
                                    type="text"
                                    value={formData.nipy}
                                    onChange={(e) => setFormData({ ...formData, nipy: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                >
                                    <option value="" disabled>Pilih Jabatan</option>
                                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                                    <option value="Guru BK">Guru BK</option>
                                    <optgroup label="Struktural (Hanya 1 Orang)">
                                        <option value="Kepala Sekolah">Kepala Sekolah</option>
                                        <option value="Wakasek Bid Kurikulum">Wakasek Bid Kurikulum</option>
                                        <option value="Wakasek Bid Kesiswaan">Wakasek Bid Kesiswaan</option>
                                        <option value="Wakasek Bid Sarpras">Wakasek Bid Sarpras</option>
                                        <option value="Wakasek Bid Hubin">Wakasek Bid Hubin</option>
                                        <option value="Kepala Komli RPL">Kepala Komli RPL</option>
                                        <option value="Kepala Komli DKV">Kepala Komli DKV</option>
                                        <option value="Kepala Komli Animasi">Kepala Komli Animasi</option>
                                        <option value="Kepala Komli AKT">Kepala Komli AKT</option>
                                        <option value="Kepala Komli Pemasaran">Kepala Komli Pemasaran</option>
                                        <option value="Kepala Urusan TU">Kepala Urusan TU</option>
                                        <option value="Koordinator Keagamaan">Koordinator Keagamaan</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                <input
                                    type="file"
                                    onChange={(e) => setPhoto(e.target.files[0])}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    accept="image/*"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Teacher</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTeachers;
