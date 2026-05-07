import React from 'react';
import { motion } from 'framer-motion';
import { 
    School, MapPin, Calendar, Award, Rocket, Target, 
    BookOpen, Users, GraduationCap, ChevronRight, ExternalLink, Clock, Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const majors = [
        { name: 'Rekayasa Perangkat Lunak', slug: 'rpl', gradient: 'from-violet-600 to-purple-700', icon: Rocket },
        { name: 'Akuntansi dan Keuangan Lembaga', slug: 'akl', gradient: 'from-emerald-600 to-teal-600', icon: Target },
        { name: 'Desain Komunikasi Visual', slug: 'dkv', gradient: 'from-pink-600 to-rose-600', icon: Award },
        { name: 'Animasi', slug: 'animasi', gradient: 'from-orange-500 to-amber-600', icon: GraduationCap },
        { name: 'Bisnis Daring dan Pemasaran', slug: 'bdp', gradient: 'from-sky-500 to-cyan-600', icon: BookOpen }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* Navigation Placeholder (Consistent with Home) */}
            <header className="bg-white/90 backdrop-blur-md border-b border-blue-50 sticky top-0 w-full z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
                                <School className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-xl tracking-tight text-gray-900">BAKNUS <span className="text-blue-600">666</span></span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creative Industry School</span>
                            </div>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Beranda</Link>
                            <Link to="/profile" className="text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5">Profil</Link>
                            <Link to="/majors" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Jurusan</Link>
                            <Link to="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5">
                                Masuk
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* --- Hero Section --- */}
            <section className="relative py-20 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-400 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest mb-6 border border-blue-500/30 backdrop-blur-sm">
                            Profil Sekolah
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Pusat Keunggulan <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Industri Kreatif</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
                            SMK Bakti Nusantara 666 adalah Sekolah Menengah Kejuruan berbasis industri kreatif yang berdiri sejak tahun 2007, berlokasi di Cileunyi, Kabupaten Bandung.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* --- Stats/Highlights --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { icon: Award, label: "Akreditasi", value: "A (Unggul)" },
                        { icon: Calendar, label: "Berdiri Sejak", value: "2007" },
                        { icon: Rocket, label: "Status", value: "Pusat Keunggulan" },
                        { icon: Users, label: "Basis", value: "Industri Kreatif" }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-blue-50 flex items-center gap-4"
                        >
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                <p className="font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- History & Content --- */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                        <motion.div {...fadeIn}>
                            <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                                <div className="w-12 h-1.5 bg-blue-600 rounded-full"></div>
                                Sejarah & Profil Singkat
                            </h2>
                            <div className="space-y-8">
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    Di bawah naungan <strong>Yayasan Pendidikan Dasar dan Menengah Bakti Nusantara 666</strong>, sekolah ini difokuskan pada kejuruan industri kreatif dengan Akreditasi A, serta menjadi sekolah pusat keunggulan.
                                </p>
                                
                                <div className="space-y-6">
                                    {[
                                        { title: "Pendirian", desc: "Yayasan Bakti Nusantara 666 disahkan berdasarkan dokumen Kemendikbud pada tanggal 3 April 2007, yang menandai awal pengelolaan sekolah." },
                                        { title: "Perkembangan", desc: "Sekolah ini berkembang menjadi pusat keunggulan yang menerapkan model pembelajaran teaching factory (pembelajaran berbasis produksi/industri) sejak 2019." },
                                        { title: "Kemitraan", desc: "Sering melakukan kolaborasi dengan dunia industri untuk magang siswa, termasuk kunjungan industri (seperti yang dilakukan ke Okezone pada 2014) dan kerjasama dengan perusahaan teknologi Inovindo." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-4 h-4 rounded-full bg-blue-100 border-4 border-blue-600 group-hover:scale-125 transition-transform"></div>
                                                <div className="w-0.5 flex-1 bg-gray-100 my-2"></div>
                                            </div>
                                            <div className="pb-4">
                                                <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                                                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <a 
                                    href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/20267919" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl font-bold transition-all text-sm group"
                                >
                                    Referensi Data Kemendikbud <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>
                        </motion.div>

                        <motion.div 
                            {...fadeIn}
                            className="bg-slate-50 rounded-3xl p-8 border border-slate-200 sticky top-32"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <MapPin className="w-6 h-6 text-red-500" /> Lokasi Strategis
                            </h3>
                            <p className="text-gray-600 mb-6 text-sm">
                                Jl. Percobaan Km. 17 No. 65, Cimekar, Kecamatan Cileunyi, Kabupaten Bandung, Jawa Barat.
                            </p>
                            
                            {/* Google Maps Embed using precise coordinates */}
                            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-inner border border-gray-200 bg-white mb-6">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.528485203348!2d107.73739887587636!3d-6.946853668007255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68c4a0349479b1%3A0x6b4458f27663240e!2sSMK%20Bakti%20Nusantara%20666!5e0!3m2!1sid!2sid!4v1715011200000!5m2!1sid!2sid" 
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen="" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Lokasi SMK Bakti Nusantara 666"
                                ></iframe>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100">
                                    <Clock className="w-5 h-5 text-blue-500 mb-2" />
                                    <h5 className="font-bold text-sm">Jam Operasional</h5>
                                    <p className="text-xs text-gray-500">Senin - Jumat: 07:00 - 15:30</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100">
                                    <Activity className="w-5 h-5 text-green-500 mb-2" />
                                    <h5 className="font-bold text-sm">NPSN</h5>
                                    <p className="text-xs text-gray-500">20267919</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- Majors Section --- */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent opacity-10"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div {...fadeIn} className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-6">Program Keahlian</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Fokus pada industri kreatif, kami menawarkan 5 program keahlian unggulan yang dirancang untuk kebutuhan masa depan.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {majors.map((major, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative"
                            >
                                <Link to={`/majors/${major.slug}`}>
                                    <div className={`p-8 rounded-3xl bg-gradient-to-br ${major.gradient} h-full min-h-[250px] flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-xl group-hover:shadow-blue-500/20`}>
                                        <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6">
                                            <major.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white mb-2 leading-tight">{major.name}</h3>
                                            <div className="flex items-center gap-2 text-white/70 text-sm font-bold group-hover:text-white transition-colors">
                                                Detail Jurusan <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Footer (Simple for Profile) --- */}
            <footer className="py-12 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} SMK Bakti Nusantara 666. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Profile;
