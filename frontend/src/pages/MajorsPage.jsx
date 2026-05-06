import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight, BookOpen, GraduationCap, Users, Award, Briefcase,
    ChevronRight, Search, Star, ArrowLeft, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

// Metadata statis per jurusan (slug -> data visual)
const majorMeta = {
    default: {
        gradient: 'from-blue-600 to-indigo-600',
        lightBg: 'bg-blue-50',
        accent: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        icon: BookOpen,
        highlights: ['Pembelajaran modern', 'Guru profesional', 'Lab lengkap', 'Siap kerja'],
        prospek: ['Teknisi', 'Staf Profesional', 'Wirausaha', 'Pendidikan Lanjut'],
    },
    rpl: {
        gradient: 'from-violet-600 to-purple-700',
        lightBg: 'bg-violet-50',
        accent: 'text-violet-600',
        badge: 'bg-violet-100 text-violet-700',
        icon: BookOpen,
        highlights: ['Pemrograman Web & Mobile', 'Database Management', 'UI/UX Design', 'Keamanan Siber'],
        prospek: ['Web Developer', 'Mobile Developer', 'UI/UX Designer', 'Software Engineer', 'Data Analyst'],
    },
    akl: {
        gradient: 'from-emerald-600 to-teal-600',
        lightBg: 'bg-emerald-50',
        accent: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
        icon: BookOpen,
        highlights: ['Akuntansi Digital', 'Perpajakan', 'Software Akuntansi (Zahir, MYOB)', 'Laporan Keuangan Lembaga'],
        prospek: ['Akuntan', 'Staf Keuangan', 'Auditor', 'Tax Consultant', 'Teller Bank'],
    },
    dkv: {
        gradient: 'from-pink-600 to-rose-600',
        lightBg: 'bg-pink-50',
        accent: 'text-pink-600',
        badge: 'bg-pink-100 text-pink-700',
        icon: BookOpen,
        highlights: ['Adobe Creative Suite', 'Fotografi & Videografi', 'Branding & Identitas Visual', 'Ilustrasi Digital'],
        prospek: ['Graphic Designer', 'Content Creator', 'Fotografer', 'Videografer', 'Art Director'],
    },
    animasi: {
        gradient: 'from-orange-500 to-amber-600',
        lightBg: 'bg-orange-50',
        accent: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700',
        icon: BookOpen,
        highlights: ['Animasi 2D & 3D', 'Motion Graphics', 'Visual Effects (VFX)', 'Game Development'],
        prospek: ['Animator', 'Motion Designer', 'Game Developer', 'VFX Artist', 'Storyboard Artist'],
    },
    bdp: {
        gradient: 'from-sky-500 to-cyan-600',
        lightBg: 'bg-sky-50',
        accent: 'text-sky-600',
        badge: 'bg-sky-100 text-sky-700',
        icon: BookOpen,
        highlights: ['Digital Marketing', 'E-Commerce & Marketplace', 'Strategi Penjualan Online', 'Komunikasi Bisnis'],
        prospek: ['Digital Marketer', 'Social Media Manager', 'E-Commerce Specialist', 'Sales Manager', 'Entrepreneur'],
    },
};

function getSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function getMeta(name) {
    const n = name.toLowerCase();
    if (n.includes('perangkat lunak') || n.includes('rpl')) return majorMeta.rpl;
    if (n.includes('keuangan') || n.includes('akl') || n.includes('akuntansi')) return majorMeta.akl;
    if (n.includes('komunikasi visual') || n.includes('dkv')) return majorMeta.dkv;
    if (n.includes('animasi')) return majorMeta.animasi;
    if (n.includes('bisnis') || n.includes('pemasaran') || n.includes('bdp')) return majorMeta.bdp;
    return majorMeta.default;
}

const MajorsPage = () => {
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        api.get('/majors/').then(r => {
            setMajors(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = majors.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* ---------- NAVBAR ---------- */}
            <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-3">
                    <div className="flex items-center gap-3">
                        <img src="/static/images/logo-school.png" alt="Logo SMK BN 666" className="h-12 object-contain" />
                        <div>
                            <p className="font-bold text-blue-900 leading-tight text-base">SMK Bakti Nusantara 666</p>
                            <p className="text-xs text-blue-400 tracking-widest uppercase">Santun · Jujur · Taat</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Beranda</Link>
                        <Link to="/majors" className="text-blue-600 font-semibold text-sm border-b-2 border-blue-600 pb-0.5">Jurusan</Link>
                        <a href="https://spmb.smkbn666.sch.id" target="_blank" rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md shadow-blue-200">
                            Daftar SPMB
                        </a>
                    </div>
                    <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </nav>
                {menuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-3">
                        <Link to="/" className="text-gray-700 py-2 font-medium">Beranda</Link>
                        <Link to="/majors" className="text-blue-600 py-2 font-semibold">Jurusan</Link>
                        <a href="https://spmb.smkbn666.sch.id" target="_blank" rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold text-center">
                            Daftar SPMB
                        </a>
                    </div>
                )}
            </header>

            {/* ---------- HERO ---------- */}
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-24 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                            <GraduationCap className="w-4 h-4" /> 5 Program Keahlian
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Temukan Jurusan<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                                Impianmu
                            </span>
                        </h1>
                        <p className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                            SMK Bakti Nusantara 666 menawarkan 5 program keahlian yang relevan dengan industri modern dan kebutuhan masa depan.
                        </p>
                        {/* Search Box */}
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari program keahlian..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-800 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ---------- STATS BAR ---------- */}
            <section className="bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {[
                        { label: 'Program Keahlian', value: '5' },
                        { label: 'Siswa Aktif', value: '1.200+' },
                        { label: 'Lulusan Terserap', value: '90%' },
                        { label: 'Mitra Industri', value: '50+' },
                    ].map((s, i) => (
                        <div key={i}>
                            <p className="text-3xl font-black text-blue-700">{s.value}</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- CARD GRID ---------- */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : (
                    <>
                        {filtered.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
                                <p className="text-lg font-medium">Jurusan tidak ditemukan.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filtered.map((major, idx) => {
                                const meta = getMeta(major.name);
                                const slug = getSlug(major.name);
                                return (
                                    <motion.div
                                        key={major.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-100 transition-all duration-500 cursor-pointer flex flex-col"
                                        onClick={() => setSelected(major)}
                                    >
                                        {/* Card Header */}
                                        <div className={`relative h-52 bg-gradient-to-br ${meta.gradient} p-8 flex flex-col justify-between overflow-hidden`}>
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                                            {/* Logo or Placeholder */}
                                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 relative z-10">
                                                {major.logo_url ? (
                                                    <img src={`${apiBase}${major.logo_url}`} alt={major.name} className="w-9 h-9 object-contain" />
                                                ) : (
                                                    <GraduationCap className="w-8 h-8 text-white" />
                                                )}
                                            </div>

                                            <div className="relative z-10">
                                                <h2 className="text-xl font-bold text-white leading-tight">{major.name}</h2>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {meta.highlights.slice(0, 2).map((h, i) => (
                                                        <span key={i} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">{h}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-6 flex flex-col flex-1">
                                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                                                {major.description}
                                            </p>
                                            {/* Prospek */}
                                            <div className="mb-5">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Prospek Karir</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {meta.prospek.slice(0, 3).map((p, i) => (
                                                        <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.badge}`}>{p}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className={`flex items-center gap-2 ${meta.accent} font-bold text-sm group-hover:gap-3 transition-all`}>
                                                Lihat Detail <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                )}
            </section>

            {/* ---------- CTA SECTION ---------- */}
            <section className="bg-gradient-to-r from-blue-700 to-indigo-700 py-20">
                <div className="max-w-3xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Sudah Yakin dengan Pilihanmu?</h2>
                    <p className="text-blue-200 mb-8 text-lg">Daftarkan dirimu sekarang melalui SPMB online dan mulai perjalanan menuju masa depan cerah!</p>
                    <a
                        href="https://spmb.smkbn666.sch.id"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-yellow-300 hover:text-blue-900 px-10 py-4 rounded-full font-black text-lg transition-all shadow-xl"
                    >
                        Daftar SPMB Online <ArrowRight className="w-5 h-5" />
                    </a>
                </div>
            </section>

            {/* ---------- FOOTER ---------- */}
            <footer className="bg-slate-900 text-slate-400 text-center py-8 text-sm">
                <p>© {new Date().getFullYear()} SMK Bakti Nusantara 666. All rights reserved.</p>
                <Link to="/" className="mt-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-medium mt-3">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                </Link>
            </footer>

            {/* ---------- DETAIL MODAL ---------- */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-4"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 80, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 80, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            {(() => {
                                const meta = getMeta(selected.name);
                                return (
                                    <>
                                        <div className={`relative bg-gradient-to-br ${meta.gradient} p-8 text-white`}>
                                            <button
                                                onClick={() => setSelected(null)}
                                                className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 mb-4">
                                                {selected.logo_url ? (
                                                    <img src={`${apiBase}${selected.logo_url}`} alt={selected.name} className="w-10 h-10 object-contain" />
                                                ) : (
                                                    <GraduationCap className="w-9 h-9 text-white" />
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-black">{selected.name}</h2>
                                            <p className="text-white/80 text-sm mt-1">Program Keahlian · SMK Bakti Nusantara 666</p>
                                        </div>

                                        <div className="p-8">
                                            {/* Description */}
                                            <h3 className="font-bold text-gray-900 mb-2">Tentang Program</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-6">{selected.description}</p>

                                            {/* Highlights */}
                                            <h3 className="font-bold text-gray-900 mb-3">Yang Akan Dipelajari</h3>
                                            <div className="grid grid-cols-2 gap-2 mb-6">
                                                {meta.highlights.map((h, i) => (
                                                    <div key={i} className={`flex items-center gap-2 p-3 rounded-xl ${meta.lightBg}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${meta.accent.replace('text-', 'bg-')}`} />
                                                        <span className="text-sm font-medium text-gray-700">{h}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Prospek */}
                                            <h3 className="font-bold text-gray-900 mb-3">Prospek Karir</h3>
                                            <div className="flex flex-wrap gap-2 mb-8">
                                                {meta.prospek.map((p, i) => (
                                                    <span key={i} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${meta.badge}`}>{p}</span>
                                                ))}
                                            </div>

                                            {/* CTA */}
                                            <div className="flex gap-4">
                                                <Link
                                                    to={`/majors/${getSlug(selected.name)}`}
                                                    className={`flex-1 flex items-center justify-center gap-2 border-2 border-${meta.color}-600 ${meta.accent} py-4 rounded-2xl font-bold text-sm hover:bg-${meta.color}-50 transition-colors`}
                                                >
                                                    Lihat Halaman Penuh
                                                </Link>
                                                <a
                                                    href="https://spmb.smkbn666.sch.id"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex-1 flex items-center justify-center gap-2 bg-gradient-to-r ${meta.gradient} text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg`}
                                                >
                                                    Daftar SPMB <ArrowRight className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MajorsPage;
