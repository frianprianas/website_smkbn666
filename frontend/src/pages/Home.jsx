import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    School, ArrowRight, BookOpen, Users, Trophy, Facebook, Instagram,
    Video, MessageCircle, ChevronRight, GraduationCap, Star,
    PlayCircle, MapPin, Calendar, Clock, Award, Activity
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, animate, useInView } from 'framer-motion';
import api from '../api';

const Home = () => {
    // --- State Management ---
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [majors, setMajors] = useState([]);
    const [news, setNews] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [partners, setPartners] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0);
    const [testimonials, setTestimonials] = useState([]);
    const [agendas, setAgendas] = useState([]);
    const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // --- Refs for Scroll Effects ---
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });
    const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
    const headerY = useTransform(scrollYProgress, [0, 0.2], [-20, 0]);

    // --- Helper Component for Counter ---
    const Counter = ({ from, to }) => {
        const nodeRef = useRef();
        const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

        useEffect(() => {
            const node = nodeRef.current;
            if (isInView) {
                const controls = animate(from, to, {
                    duration: 2,
                    ease: "easeOut",
                    onUpdate(value) {
                        node.textContent = Math.round(value).toLocaleString('en-US');
                    }
                });
                return () => controls.stop();
            }
        }, [from, to, isInView]);

        return <span ref={nodeRef} />;
    };

    // --- Data Mockups (for "Full" feeling) ---
    const stats = [
        { label: "Siswa Aktif", value: 1500, suffix: "+", icon: Users },
        { label: "Guru & Staff", value: 120, suffix: "+", icon: School },
        { label: "Mitra Industri", value: 50, suffix: "+", icon: Activity },
        { label: "Prestasi", value: 200, suffix: "+", icon: Award },
    ];

    // Removed static testimonials

    const images = [
        '/static/images/login-bg-1.jpg',
        '/static/images/login-bg-2.jpg',
        '/static/images/login-bg-3.jpg'
    ];

    // --- Effects ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000); // Slower rotation
        return () => clearInterval(interval);
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resMajors, resNews, resGallery, resPartners, resTeachers, resTestimonials, resAgendas] = await Promise.all([
                    api.get('/majors'),
                    api.get('/news/'),
                    api.get('/gallery/'),
                    api.get('/partners/'),
                    api.get('/staff/teachers/'),
                    api.get('/testimonials/'),
                    api.get('/agenda/')
                ]);

                setMajors(resMajors.data);
                setNews(resNews.data);
                setGallery(resGallery.data);
                setPartners(resPartners.data);
                setTestimonials(resTestimonials.data);
                setAgendas(resAgendas.data);

                const relevantPositions = ["Kepala Sekolah", "Wakasek Bid Kurikulum", "Wakasek Bid Kesiswaan", "Wakasek Bid Sarpras", "Wakasek Bid Hubin", "Kepala Komli RPL", "Kepala Komli DKV", "Kepala Komli Animasi", "Kepala Komli AKT", "Kepala Komli Pemasaran", "Kepala Urusan TU", "Koordinator Keagamaan"];
                setTeachers(resTeachers.data.filter(t => relevantPositions.includes(t.position)));
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (teachers.length === 0) return;
        const interval = setInterval(() => {
            setCurrentTeacherIndex((prev) => (prev + 1) % teachers.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [teachers]);

    const displayGallery = gallery.length > 0 ? gallery : [
        { image_url: "/static/images/teaching-factory.jpg", title: "Teaching Factory", id: "def1" },
        { image_url: "/static/images/ceremony.jpg", title: "Upacara Bendera", id: "def2" },
        { image_url: "/static/images/achievement.jpg", title: "Prestasi Siswa", id: "def3" },
        { image_url: "/static/images/band.jpg", title: "Ekstrakurikuler", id: "def4" }
    ];

    return (
        <div ref={targetRef} className="min-h-screen bg-white relative overflow-x-hidden selection:bg-blue-500 selection:text-white font-sans">

            {/* --- Dynamic Background Elements --- */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px]"
                ></motion.div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-200/30 rounded-full blur-[100px]"
                ></motion.div>
                <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "radial-gradient(#3b82f6 0.5px, transparent 0.5px)", backgroundSize: "32px 32px" }}></div>
            </div>

            {/* --- Navigation --- */}
            <nav className="bg-white/90 backdrop-blur-md border-b border-blue-50 fixed w-full z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <img src="/static/images/logo-school.png" alt="SMK Bakti Nusantara 666" className="h-12 md:h-14 object-contain drop-shadow-sm" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xl md:text-2xl text-blue-900 leading-none">SMK Bakti Nusantara 666</span>
                                <span className="text-xs text-blue-500 font-medium tracking-widest uppercase">Santun, Jujur, Taat</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-6">
                            {/* Add simple nav links for "Full" feeling */}
                            <Link to="#" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Profil</Link>
                            <Link to="#" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Jurusan</Link>
                            <Link to="#" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">Berita</Link>
                            <Link
                                to="/login"
                                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 transform hover:-translate-y-0.5"
                            >
                                Login System <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <div className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/40 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${images[currentImageIndex]}')` }}
                        />
                    </AnimatePresence>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full pt-16">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-md border border-white/20 text-blue-50 font-semibold text-sm mb-6">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span>Sekolah Pusat Keunggulan (Center of Excellence)</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
                                Membangun Generasi <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-300">Unggul & Berkarakter</span>
                            </h1>
                            <p className="text-xl text-blue-100 mb-10 leading-relaxed font-light max-w-2xl drop-shadow-md">
                                SMK Bakti Nusantara 666 berkomitmen mencetak lulusan kompeten dengan prinsip Santun, Jujur, dan Taat (SAJUTA).
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-2 group">
                                    Jelajahi Jurusan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button onClick={() => setIsVideoModalOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/50 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                    <PlayCircle className="w-5 h-5" /> Video Profil
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-white/70"
                >
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1">
                        <div className="w-1 h-3 bg-white/50 rounded-full"></div>
                    </div>
                </motion.div>
            </div>

            {/* --- Stats Counter Section (New) --- */}
            <div className="relative z-30 -mt-20 px-4">
                <div className="max-w-7xl mx-auto rounded-3xl bg-blue-600 text-white shadow-2xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    </div>
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2, duration: 0.5 }}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                            className="flex items-center gap-4 relative z-10 w-full md:w-auto border-b md:border-b-0 border-white/20 pb-4 md:pb-0 last:border-0 last:pb-0 rounded-xl p-4 transition-colors"
                        >
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                <stat.icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold flex items-baseline">
                                    <Counter from={0} to={stat.value} />
                                    <span>{stat.suffix}</span>
                                </h4>
                                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- Info Dashboard Grid --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">

                    {/* Welcome/About Snippet (Wide) */}
                    <div className="col-span-1 md:col-span-8 bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 border border-blue-100 shadow-lg flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <School className="w-48 h-48 text-blue-900" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <span className="text-blue-600 font-bold uppercase tracking-wider text-xs mb-2 block">Sambutan Kepala Sekolah</span>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mewujudkan Pendidikan Berkualitas</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Selamat datang di website resmi SMK Bakti Nusantara 666. Kami berdedikasi untuk memberikan layanan pendidikan terbaik, mengintegrasikan teknologi dan karakter untuk masa depan.
                            </p>
                            <Link to="#" className="text-blue-600 font-bold hover:gap-2 transition-all inline-flex items-center">
                                Baca Selengkapnya <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                        {/* Dynamic Rotating Teacher/Principal */}
                        <div className="w-full md:w-64 relative shrink-0">
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-inner bg-gray-200 relative">
                                <AnimatePresence mode='wait'>
                                    {teachers.length > 0 && (
                                        <motion.div
                                            key={currentTeacherIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute inset-0"
                                        >
                                            {teachers[currentTeacherIndex].photo_url ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${teachers[currentTeacherIndex].photo_url}`}
                                                    alt={teachers[currentTeacherIndex].name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100"><Users className="w-12 h-12 text-gray-400" /></div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                                <p className="font-bold text-sm truncate">{teachers[currentTeacherIndex].name}</p>
                                                <p className="text-xs text-blue-200 truncate">{teachers[currentTeacherIndex].position}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Calendar (Tall) */}
                    <div className="col-span-1 md:col-span-4 row-span-2 bg-white rounded-3xl p-6 border border-blue-50 shadow-lg flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" /> Agenda
                            </h3>
                            <span className="text-xs font-medium text-gray-400">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="w-full aspect-square bg-blue-50/50 rounded-2xl p-4 mb-4">
                            {/* Mini Calendar Implementation */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                                <div>M</div><div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {(() => {
                                    const today = new Date();
                                    const year = today.getFullYear();
                                    const month = today.getMonth();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const days = [];
                                    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`}></div>);
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const isToday = d === today.getDate();
                                        const hasAgenda = agendas.some(a => {
                                            const aDate = new Date(a.date);
                                            return aDate.getDate() === d && aDate.getMonth() === month && aDate.getFullYear() === year;
                                        });

                                        days.push(
                                            <div key={d} className={`p-1 flex items-center justify-center rounded-full aspect-square text-xs transition-colors relative 
                                                ${isToday ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}
                                                ${hasAgenda && !isToday ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                                            `}>
                                                {d}
                                                {hasAgenda && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></div>}
                                            </div>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>
                        </div>
                        <div className="w-full space-y-3">
                            {/* Dynamic Agenda Items */}
                            {agendas.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer group">
                                    <div className="bg-blue-100 text-blue-600 font-bold rounded-lg w-10 h-10 flex flex-col items-center justify-center shrink-0 leading-none">
                                        <span className="text-[10px] uppercase text-blue-500">{new Date(item.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                        <span className="text-lg">{new Date(item.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 line-clamp-1">{item.title}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{item.location || 'Sekolah'}</p>
                                    </div>
                                </div>
                            ))}
                            {agendas.length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-4">Belum ada agenda.</p>
                            )}
                        </div>
                    </div>

                    {/* Features Row */}
                    <div className="col-span-1 md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: BookOpen, title: "Kurikulum Merdeka", text: "Pembelajaran berpusat pada siswa.", bg: "bg-blue-50" },
                            { icon: Trophy, title: "Ekstrakurikuler", text: "20+ Kegiatan pengembangan diri.", bg: "bg-green-50" },
                            { icon: GraduationCap, title: "Siap Kerja", text: "Link & Match dengan industri.", bg: "bg-orange-50" }
                        ].map((f, i) => (
                            <div key={i} className={`p-6 rounded-3xl ${f.bg} border border-transparent hover:border-blue-200 transition-all shadow-sm flex flex-col items-center text-center justify-center min-h-[180px]`}>
                                <f.icon className="w-10 h-10 text-gray-800 mb-3 opacity-80" />
                                <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                                <p className="text-xs text-gray-600 max-w-[150px]">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Majors (Programs) Section --- */}
            <div className="py-24 relative bg-slate-50 border-y border-slate-200">
                {/* Parallax Background Text */}
                <div className="absolute top-10 left-0 w-full overflow-hidden pointer-events-none opacity-[0.03]">
                    <h2 className="text-[15rem] font-black text-gray-900 whitespace-nowrap -translate-x-10">PROGRAMS PROGRAMS</h2>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-2xl">
                            <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-2 block">Pilihan Jurusan</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Temukan Minatmu,<br />Raih Masa Depan.</h2>
                        </div>
                        <p className="text-gray-600 max-w-md text-right md:text-left">
                            SMK Bakti Nusantara 666 menawarkan berbagai program keahlian yang relevan dengan kebutuhan industri 4.0.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {majors.map((major, index) => (
                            <motion.div
                                key={major.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 relative"
                            >
                                <div className="h-48 bg-gray-200 relative overflow-hidden">
                                    {/* Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-600 to-blue-400' : 'from-indigo-600 to-purple-500'} opacity-90`}></div>
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg w-fit mb-2">
                                            {major.logo_url ? (
                                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${major.logo_url}`} alt={major.name} className="w-8 h-8 object-contain" />
                                            ) : (
                                                <BookOpen className="w-6 h-6 text-white" />
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold">{major.name}</h3>
                                    </div>
                                    <GraduationCap className="absolute -right-4 -top-4 w-32 h-32 text-white opacity-10 rotate-12" />
                                </div>
                                <div className="p-8">
                                    <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed">{major.description}</p>
                                    <Link to="#" className="inline-flex items-center text-blue-600 font-bold uppercase text-xs tracking-wider gap-2 group-hover:gap-4 transition-all">
                                        Selengkapnya <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Video / CTA Profile Section (New) --- */}
            <div className="py-24 relative overflow-hidden flex items-center justify-center bg-gray-900">
                <div className="absolute inset-0 opacity-40">
                    <img src="/static/images/login-bg-3.jpg" alt="Background" className="w-full h-full object-cover grayscale brightness-50" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900"></div>

                <div className="max-w-5xl mx-auto px-4 text-center relative z-10 text-white">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div onClick={() => setIsVideoModalOpen(true)} className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8 cursor-pointer hover:scale-110 transition-transform border border-white/30 group">
                            <PlayCircle className="w-10 h-10 text-white fill-white/20 group-hover:fill-white transition-colors" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">Experience Better Learning</h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Lihat bagaimana kami menciptakan lingkungan belajar yang inspiratif dan menyenangkan bagi setiap siswa.
                        </p>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-600/50">
                            Daftar Sekarang (SPMB)
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* --- News Section --- */}
            <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 border-l-4 border-blue-600 pl-4">Berita Terbaru</h2>
                    <Link to="#" className="text-gray-500 hover:text-blue-600 hidden md:block">Lihat Semua</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Featured News (Large) */}
                    {news.length > 0 && (
                        <div className="md:col-span-2 bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 group relative h-full min-h-[400px]">
                            <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${news[0].image_url}`} alt={news[0].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-8 text-white">
                                <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold w-fit mb-3">{new Date(news[0].date_posted).toLocaleDateString()}</span>
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-300 transition-colors">{news[0].title}</h3>
                                <p className="line-clamp-2 text-gray-300 text-sm">{news[0].content}</p>
                            </div>
                        </div>
                    )}
                    {/* Secondary News */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        {news.slice(1, 4).map((item) => (
                            <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                                    <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.image_url}`} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                        <Clock className="w-3 h-3" /> {new Date(item.date_posted).toLocaleDateString()}
                                    </div>
                                    <h4 className="font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">{item.title}</h4>
                                </div>
                            </div>
                        ))}
                        {news.length === 0 && <p className="text-gray-400">Loading news...</p>}
                    </div>
                </div>
            </div>

            {/* --- Testimonials / Social Proof (New) --- */}
            <div className="py-20 bg-blue-50 border-y border-blue-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">Apa Kata Mereka?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-blue-100 relative mt-8">
                                <div className="w-16 h-16 rounded-full border-4 border-white shadow-md absolute -top-8 left-1/2 -translate-x-1/2 overflow-hidden bg-gray-200">
                                    {/* Avatar */}
                                    {t.image_url ? (
                                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${t.image_url}`} alt={t.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-200 flex items-center justify-center text-blue-600 font-bold">{t.name[0]}</div>
                                    )}
                                </div>
                                <div className="mt-8">
                                    <div className="flex justify-center gap-1 mb-4 text-orange-400">
                                        {[...Array(5)].map((_, stars) => (
                                            <Star key={stars} className={`w-4 h-4 ${stars < t.rating ? 'fill-current' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-600 italic mb-6">"{t.content}"</p>
                                    <h5 className="font-bold text-gray-900">{t.name}</h5>
                                    <span className="text-xs text-blue-500 uppercase tracking-wide font-bold">{t.role}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Gallery Grid --- */}
            <div className="py-24 max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <span className="text-blue-600 font-bold text-sm tracking-widest uppercase">Dokumentasi</span>
                    <h2 className="text-3xl font-bold text-gray-900 mt-2">Galeri Aktivitas</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 h-[600px]">
                    {displayGallery.map((img, idx) => (
                        <motion.div
                            key={img.id || idx}
                            className={`relative rounded-3xl overflow-hidden group cursor-pointer ${idx === 0 ? "row-span-2 col-span-2" : "col-span-1 row-span-1"}`}
                            whileHover={{ scale: 0.98 }}
                        >
                            <img
                                src={img.image_url ? (img.image_url.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${img.image_url}` : img.image_url) : img.src}
                                alt={img.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white font-bold">{img.title}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- Partners (Grayscale to Color) --- */}
            <div className="py-16 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-10">Trusted Partners</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {partners.map((partner) => (
                            <div key={partner.id} className="w-24 h-16 flex items-center justify-center">
                                <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${partner.logo_url}`} alt={partner.name} className="max-w-full max-h-full object-contain" title={partner.name} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Mega Footer --- */}
            <footer className="bg-slate-900 text-white pt-20 pb-10 rounded-t-[3rem] mt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <img src="/static/images/logo-school.png" alt="Logo" className="w-12 h-12 object-contain" />
                                <span className="font-bold text-xl">SMK Bakti Nusantara 666</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Sekolah Pusat Keunggulan yang mencetak generasi kompeten dengan karakter Santun, Jujur, dan Taat.
                            </p>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer"><Facebook className="w-5 h-5" /></div>
                                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer"><Instagram className="w-5 h-5" /></div>
                                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-black border border-slate-700 transition-colors cursor-pointer"><Video className="w-5 h-5" /></div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Program Keahlian</h4>
                            <ul className="space-y-3 text-slate-400 text-sm">
                                <li className="hover:text-blue-400 cursor-pointer">Rekayasa Perangkat Lunak</li>
                                <li className="hover:text-blue-400 cursor-pointer">Desain Komunikasi Visual</li>
                                <li className="hover:text-blue-400 cursor-pointer">Animasi</li>
                                <li className="hover:text-blue-400 cursor-pointer">Akuntansi</li>
                                <li className="hover:text-blue-400 cursor-pointer">Pemasaran</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Tautan Cepat</h4>
                            <ul className="space-y-3 text-slate-400 text-sm">
                                <li><a href="https://prakerin.smkbn666.sch.id" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Prakerin (PKL)</a></li>
                                <li><a href="http://spmb.smkbn666.sch.id:10007" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Info SPMB</a></li>
                                <li><a href="http://erapor.smkbn666.sch.id:3154" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">E-Rapor</a></li>
                                <li><a href="https://daring.smkbn666.sch.id" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">LMS / Daring</a></li>
                                <li className="hover:text-blue-400 cursor-pointer">Karir Alumni</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-white">Hubungi Kami</h4>
                            <ul className="space-y-4 text-slate-400 text-sm">
                                <li className="flex gap-3">
                                    <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                                    Jl. Percobaan No. 65, Cileunyi, Kab. Bandung, Jawa Barat.
                                </li>
                                <li className="flex gap-3">
                                    <MessageCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                    info@smkbn666.sch.id
                                </li>
                                <li className="flex gap-3">
                                    <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                                    Senin - Jumat: 07.00 - 16.00
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                        <p>&copy; 2024 SMK Bakti Nusantara 666. All rights reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-white cursor-pointer">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Facebook Modal */}
            {isFacebookModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setIsFacebookModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl relative overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Facebook className="w-5 h-5 text-blue-600" /> Facebook Page
                            </h3>
                            <button onClick={() => setIsFacebookModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="flex-1 bg-gray-100 relative">
                            {/* Iframe content */}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {isVideoModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[70] p-4" onClick={() => setIsVideoModalOpen(false)}>
                    <div className="bg-black rounded-3xl w-full max-w-5xl aspect-video shadow-2xl relative overflow-hidden ring-1 ring-white/20" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsVideoModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-10 p-2 bg-black/50 rounded-full backdrop-blur-sm transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/mAZfnQBrFqI?autoplay=1"
                            title="Video Profil SMK Bakti Nusantara 666"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
