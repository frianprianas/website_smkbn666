import React, { useEffect, useState } from 'react';
import { Plus, Trash2, User, Key, Edit2, Shield } from 'lucide-react';
import api from '../api';

const ManageContributors = () => {
    const [contributors, setContributors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [permissions, setPermissions] = useState({
        news: false,
        agenda: false,
        majors: false,
        gallery: false,
        partners: false
    });
    const [loading, setLoading] = useState(false);

    const fetchContributors = async () => {
        try {
            // Fetch users with role='kontributor' or 'contributor'
            // My backend filter is exact match.
            // Let's try 'kontributor' first as requested.
            const res = await api.get('/users/?role=kontributor');
            setContributors(res.data);

            // Note: If you have mixed 'contributor' and 'kontributor' in DB, you might need two fetches or a backend change.
            // For now assuming new users created via this panel will differ based on what I send.
            // I will default to 'kontributor' for new users.
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchContributors();
    }, []);

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setPermissions({
            news: false,
            agenda: false,
            majors: false,
            gallery: false,
            partners: false
        });
        setIsEditMode(false);
        setCurrentId(null);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setUsername(user.username);
        setPassword(''); // Password empty means don't change
        setCurrentId(user.id);

        // Parse permissions from string "news,agenda" to object
        const userPerms = (user.permissions || "").split(",");
        setPermissions({
            news: userPerms.includes('news'),
            agenda: userPerms.includes('agenda'),
            majors: userPerms.includes('majors'),
            gallery: userPerms.includes('gallery'),
            partners: userPerms.includes('partners')
        });

        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('username', username);
            data.append('role', 'kontributor');

            // Construct permissions string
            const permString = Object.keys(permissions)
                .filter(key => permissions[key])
                .join(',');
            data.append('permissions', permString);

            if (isEditMode) {
                if (password) data.append('password', password);
                // else no password change

                await api.put(`/users/${currentId}`, data);
            } else {
                if (!password) {
                    alert("Password is required for new user");
                    setLoading(false);
                    return;
                }
                data.append('password', password);
                await api.post('/users/', data);
            }

            resetForm();
            setIsModalOpen(false);
            fetchContributors();
        } catch (err) {
            console.error(err);
            alert("Failed to save contributor. Username might be taken.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this contributor?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchContributors();
            } catch (err) {
                console.error(err);
                alert("Failed to delete");
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Data Kontributor</h1>
                    <p className="text-gray-500">Manage news and gallery contributors</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Contributor
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Username</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {contributors.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-gray-900">{user.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                        <Shield className="w-3 h-3" />
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Password/Username"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {contributors.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                    No contributors found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Contributor' : 'Add Contributor'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-9 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {isEditMode ? 'New Password (Optional)' : 'Password'}
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-9 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={isEditMode ? "Leave empty to keep current" : ""}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={permissions.news} onChange={(e) => setPermissions({ ...permissions, news: e.target.checked })} className="rounded text-blue-600" />
                                        <span className="text-sm">Manage News</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={permissions.agenda} onChange={(e) => setPermissions({ ...permissions, agenda: e.target.checked })} className="rounded text-blue-600" />
                                        <span className="text-sm">Manage Agenda</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={permissions.majors} onChange={(e) => setPermissions({ ...permissions, majors: e.target.checked })} className="rounded text-blue-600" />
                                        <span className="text-sm">Manage Majors (Jurusan)</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={permissions.gallery} onChange={(e) => setPermissions({ ...permissions, gallery: e.target.checked })} className="rounded text-blue-600" />
                                        <span className="text-sm">Manage Gallery</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={permissions.partners} onChange={(e) => setPermissions({ ...permissions, partners: e.target.checked })} className="rounded text-blue-600" />
                                        <span className="text-sm">Manage Partners (Mitra)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageContributors;
