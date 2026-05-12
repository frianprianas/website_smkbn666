import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

const SPMBModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has already closed the modal in this session
        const hasSeenModal = localStorage.getItem('hasSeenPPDB2026');
        
        if (!hasSeenModal) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500); // Show after 1.5 seconds
            return () => clearTimeout(timer);
        }
    }, []);

    const closeModal = () => {
        setIsOpen(false);
        // Optional: Save to localStorage if you want to hide it forever for this user
        // localStorage.setItem('hasSeenPPDB2026', 'true');
    };

    const handleDontShowAgain = () => {
        localStorage.setItem('hasSeenPPDB2026', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row shadow-blue-500/20"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Left Side: Visual */}
                        <div className="relative w-full md:w-1/2 h-48 md:h-auto overflow-hidden bg-blue-900">
                            <img 
                                src="/static/images/login-bg-1.jpg" 
                                alt="SMK Bakti Nusantara 666" 
                                className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-transparent to-transparent md:bg-gradient-to-r" />
                            
                            <div className="absolute bottom-6 left-6 text-white">
                                <div className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 w-fit">
                                    <Sparkles className="w-3 h-3" /> Pendaftaran Dibuka
                                </div>
                                <h3 className="text-2xl font-black leading-tight">Mulai Karir <br/>Masa Depanmu</h3>
                            </div>
                        </div>

                        {/* Right Side: Info */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                    <GraduationCap className="w-8 h-8" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">PPDB 2026/2027</h4>
                                    <p className="text-xl font-black text-gray-900">SMK Bakti Nusantara 666</p>
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                                Jadilah Bagian dari <span className="text-blue-600 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Generasi Hebat!</span>
                            </h2>
                            
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Telah dibuka pendaftaran siswa baru secara online. Pilih jurusan impianmu dan raih prestasi bersama sekolah industri kreatif terbaik.
                            </p>

                            <div className="flex flex-col gap-4">
                                <a 
                                    href="https://spmb.smkbn666.sch.id" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/30 group"
                                >
                                    Daftar Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </a>
                                
                                <button 
                                    onClick={handleDontShowAgain}
                                    className="text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
                                >
                                    Jangan tampilkan lagi
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SPMBModal;
