import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Newspaper, Users, GraduationCap, BookOpen, LogOut, School, Image, Building2, MessageSquare, Calendar } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    // Define menu items with required permission key (matches User.permissions string)
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'kontributor'], perm: null }, // Everyone sees dashboard
        { name: 'Berita', path: '/news', icon: Newspaper, roles: ['admin', 'kontributor'], perm: 'news' },
        { name: 'Agenda', path: '/agenda', icon: Calendar, roles: ['admin', 'kontributor'], perm: 'agenda' },
        { name: 'Data Guru', path: '/teachers', icon: Users, roles: ['admin'], perm: null }, // Admin only
        { name: 'Data TU', path: '/staff', icon: GraduationCap, roles: ['admin'], perm: null }, // Admin only
        { name: 'Data Jurusan', path: '/majors', icon: BookOpen, roles: ['admin'], perm: 'majors' }, // Admin or Contributor with permission? Wait, original requirement said Majors is optional for contributor too? Yes.
        // Actually, for Majors: "kecuali data guru,TU, kontributor". Majors WAS listed as selectable.
        // If it's admin role, it always passes. If contributor, check permission.
        { name: 'Data Jurusan', path: '/majors', icon: BookOpen, roles: ['admin', 'kontributor'], perm: 'majors' },

        { name: 'Galeri Sekolah', path: '/gallery', icon: Image, roles: ['admin', 'kontributor'], perm: 'gallery' },
        { name: 'Data Mitra', path: '/partners', icon: Building2, roles: ['admin', 'kontributor'], perm: 'partners' },
        { name: 'Testimoni', path: '/testimonials', icon: MessageSquare, roles: ['admin', 'kontributor'], perm: null }, // Default to all? Or need perm? Assume all if not specified
        { name: 'Data Kontributor', path: '/contributors', icon: Users, roles: ['admin'], perm: null },
    ];

    const permissions = (localStorage.getItem('permissions') || "").split(',');

    return (
        <div className="h-screen w-64 bg-white/80 backdrop-blur-md border-r border-white/20 shadow-xl flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                <School className="w-8 h-8 text-blue-500" />
                <div>
                    <h1 className="font-bold text-gray-800 text-sm">SMK Bakti</h1>
                    <h2 className="font-bold text-blue-600 text-sm">Nusantara 666</h2>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    // Check Role
                    if (!item.roles.includes(userRole)) return null;

                    // Check Permission (if contributor and item requires permission)
                    if (userRole !== 'admin' && item.perm) {
                        if (!permissions.includes(item.perm)) return null;
                    }

                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
