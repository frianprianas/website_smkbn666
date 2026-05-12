import React from 'react';
import { Newspaper, Users, GraduationCap, BookOpen, ArrowUpRight, Image, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, count, icon: Icon, color, link }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            {link && (
                <Link to={link} className="text-gray-400 hover:text-blue-500 transition-colors">
                    <ArrowUpRight className="w-5 h-5" />
                </Link>
            )}
        </div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-800">{count}</p>
    </div>
);

const Dashboard = () => {
    const userRole = localStorage.getItem('role');
    // In a real app, fetch these counts from API
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back to SMK Bakti Nusantara 666 Admin Panel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Berita"
                    count="12"
                    icon={Newspaper}
                    color="bg-blue-500"
                    link="/news"
                />
                <StatCard
                    title="Data Guru"
                    count="48"
                    icon={Users}
                    color="bg-indigo-500"
                    link={userRole === 'admin' ? "/teachers" : null}
                />
                <StatCard
                    title="Data TU"
                    count="15"
                    icon={GraduationCap}
                    color="bg-purple-500"
                    link={userRole === 'admin' ? "/staff" : null}
                />
                <StatCard
                    title="Jurusan"
                    count="5"
                    icon={BookOpen}
                    color="bg-pink-500"
                    link={userRole === 'admin' ? "/majors" : null}
                />
                <StatCard
                    title="Galeri"
                    count="-"
                    icon={Image}
                    color="bg-orange-500"
                    link="/gallery"
                />
                <StatCard
                    title="Testimoni"
                    count="-"
                    icon={MessageSquare}
                    color="bg-green-500"
                    link="/testimonials"
                />
                <StatCard
                    title="WhatsApp"
                    count="Admin"
                    icon={MessageSquare}
                    color="bg-emerald-600"
                    link={userRole === 'admin' ? "/wa" : null}
                />
            </div>

            {/* Gallery Section */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Galeri Sekolah</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="group relative overflow-hidden rounded-xl h-48 cursor-pointer shadow-lg">
                        <img src="/images/teaching-factory.jpg" alt="Teaching Factory" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Teaching Factory</span>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl h-48 cursor-pointer shadow-lg">
                        <img src="/images/ceremony.jpg" alt="Upacara Bendera" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Kegiatan Upacara</span>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl h-48 cursor-pointer shadow-lg">
                        <img src="/images/achievement.jpg" alt="Prestasi" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Prestasi Siswa</span>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl h-48 cursor-pointer shadow-lg">
                        <img src="/images/band.jpg" alt="Ekstrakurikuler" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Ekstrakurikuler</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity or Quick Actions could go here */}
            <div className="mt-8 bg-white rounded-2xl p-8 border border-white/50 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <Link to="/admin/news" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium">Post New News</Link>
                    {userRole === 'admin' && (
                        <Link to="/teachers" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium">Add Teacher</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
