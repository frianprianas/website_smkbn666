import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Briefcase, GraduationCap, ArrowRight, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const majorsData = {
    'rpl': {
        name: 'Rekayasa Perangkat Lunak',
        slug: 'rpl',
        color: 'violet',
        gradient: 'from-violet-600 to-purple-800',
        lightBg: 'bg-violet-50',
        textColor: 'text-violet-600',
        description: 'Program keahlian yang mempelajari cara merancang, membuat, memelihara, dan mengembangkan perangkat lunak (software) untuk berbagai platform seperti web, desktop, dan mobile. Menggabungkan logika, algoritma, dan kreativitas untuk memecahkan masalah melalui teknologi.',
        skl: [
            'Mampu menganalisis dan merancang sistem informasi.',
            'Menguasai berbagai bahasa pemrograman (HTML, CSS, JavaScript, PHP, Python, dll).',
            'Mampu merancang dan mengelola Basis Data (Database/SQL).',
            'Mengembangkan aplikasi berbasis Web dan Mobile (Android/iOS).',
            'Memahami dasar UI/UX Design dan Version Control (Git).',
            'Mampu melakukan testing, debugging, dan pemeliharaan perangkat lunak.'
        ],
        prospek: [
            'Web Developer', 'Mobile App Developer', 'Software Engineer', 
            'Database Administrator', 'UI/UX Designer', 'IT Consultant / System Analyst'
        ]
    },
    'akl': {
        name: 'Akuntansi dan Keuangan Lembaga',
        slug: 'akl',
        color: 'emerald',
        gradient: 'from-emerald-600 to-teal-800',
        lightBg: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        description: 'Program keahlian yang membekali siswa dengan kompetensi dalam mengelola arus keuangan, menyusun laporan akuntansi, dan memahami sistem perpajakan, baik secara manual maupun menggunakan perangkat lunak akuntansi modern.',
        skl: [
            'Mampu mengelola dokumen transaksi keuangan.',
            'Menyusun laporan keuangan untuk perusahaan jasa, dagang, dan manufaktur.',
            'Mengoperasikan aplikasi komputer akuntansi (Zahir, MYOB, Accurate).',
            'Memahami administrasi pajak dan perhitungan perpajakan (PPh, PPN).',
            'Mengelola kas kecil (Petty Cash) dan rekonsiliasi bank.',
            'Menguasai etika profesi dan komunikasi bisnis di bidang keuangan.'
        ],
        prospek: [
            'Staf Akuntansi / Accounting Staff', 'Teller / Customer Service Bank', 
            'Staf Administrasi Keuangan', 'Kasir / Tata Usaha', 'Auditor Junior', 'Konsultan Pajak Junior'
        ]
    },
    'dkv': {
        name: 'Desain Komunikasi Visual',
        slug: 'dkv',
        color: 'pink',
        gradient: 'from-pink-600 to-rose-800',
        lightBg: 'bg-pink-50',
        textColor: 'text-pink-600',
        description: 'Program keahlian yang mempelajari ilmu komunikasi melalui elemen visual seperti tipografi, fotografi, ilustrasi, dan desain antarmuka. Siswa dilatih untuk menyampaikan pesan secara kreatif, estetis, dan efektif kepada audiens.',
        skl: [
            'Mengoperasikan perangkat lunak desain (Adobe Illustrator, Photoshop, CorelDraw, dll).',
            'Mampu merancang identitas visual (Branding, Logo, Mascot).',
            'Menguasai teknik dasar fotografi dan videografi.',
            'Mampu membuat ilustrasi manual maupun digital.',
            'Merancang media promosi (Poster, Brosur, Billboard, Packaging).',
            'Memahami prinsip tata letak (layout) dan tipografi.'
        ],
        prospek: [
            'Graphic Designer', 'Illustrator', 'Fotografer & Videografer', 
            'Content Creator', 'Art Director', 'Web Designer'
        ]
    },
    'animasi': {
        name: 'Animasi',
        slug: 'animasi',
        color: 'orange',
        gradient: 'from-orange-500 to-amber-700',
        lightBg: 'bg-orange-50',
        textColor: 'text-orange-600',
        description: 'Program keahlian yang berfokus pada seni menggerakkan gambar (2D dan 3D) serta efek visual, menggabungkan kreativitas seni dengan teknologi digital terkini untuk industri film, televisi, dan game.',
        skl: [
            'Mampu membuat konsep dan Storyboarding.',
            'Merancang dan menggambar karakter (Character Design) beserta environment.',
            'Menguasai teknik penganimasian objek 2D dan 3D.',
            'Mampu melakukan proses Rigging dan 3D Modeling.',
            'Menguasai teknik pencahayaan (Lighting) dan rendering.',
            'Melakukan editing video dan menambahkan efek visual (VFX).'
        ],
        prospek: [
            'Animator 2D / 3D', 'Motion Graphic Designer', 'VFX Artist', 
            'Storyboard Artist', '3D Modeler', 'Character Designer'
        ]
    },
    'bdp': {
        name: 'Bisnis Daring dan Pemasaran',
        slug: 'bdp',
        color: 'sky',
        gradient: 'from-sky-500 to-cyan-700',
        lightBg: 'bg-sky-50',
        textColor: 'text-sky-600',
        description: 'Program keahlian yang mengajarkan strategi pemasaran konvensional dan digital, mengelola bisnis online, serta teknik komunikasi bisnis untuk menjangkau pasar yang lebih luas di era revolusi industri 4.0.',
        skl: [
            'Mampu melakukan riset pasar dan analisis peluang bisnis.',
            'Merancang strategi Digital Marketing (SEO, SEM, Social Media Marketing).',
            'Mampu mengelola toko online (E-commerce) dan Marketplace.',
            'Menguasai teknik Content Marketing dan Copywriting.',
            'Melakukan pelayanan prima (Customer Service/Excellent Service).',
            'Mampu mengoperasikan mesin kasir (POS) dan mengelola inventori barang.'
        ],
        prospek: [
            'Digital Marketer', 'Social Media Specialist', 'E-commerce Specialist', 
            'Sales Executive / Marketing Staff', 'Customer Service Representative', 'Entrepreneur / Wirausaha'
        ]
    }
};

const MajorDetail = () => {
    const { slug } = useParams();
    const major = majorsData[slug];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    if (!major) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <LayoutDashboard className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Jurusan Tidak Ditemukan</h1>
                <Link to="/majors" className="text-blue-600 mt-4 hover:underline">Kembali ke Daftar Jurusan</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Hero Section */}
            <div className={`relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${major.gradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="max-w-5xl mx-auto relative z-10">
                    <Link to="/majors" className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
                    </Link>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium text-sm mb-6 shadow-sm">
                            <GraduationCap className="w-4 h-4" /> Program Keahlian
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
                            {major.name}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed drop-shadow">
                            {major.description}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {/* SKL Column */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                                <div className={`p-3 rounded-xl ${major.lightBg}`}>
                                    <CheckCircle2 className={`w-6 h-6 ${major.textColor}`} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Standar Kompetensi Lulusan (SKL)</h2>
                            </div>
                            <ul className="space-y-4">
                                {major.skl.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${major.lightBg.replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                                        <span className="text-gray-600 leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Prospek Kerja Column */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                                <div className={`p-3 rounded-xl ${major.lightBg}`}>
                                    <Briefcase className={`w-6 h-6 ${major.textColor}`} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Prospek Karir & Pekerjaan</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {major.prospek.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${major.lightBg}`}>
                                            <span className={`font-bold ${major.textColor}`}>{idx + 1}</span>
                                        </div>
                                        <span className="font-semibold text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Image Placeholder area - as requested "nanti saya tambahkan gambarnya" */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-16 pt-16 border-t border-gray-100"
                    >
                        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Galeri Pembelajaran {major.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Empty placeholders for user to add images later */}
                            <div className="aspect-[4/3] rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                                <span className="text-gray-400 font-medium group-hover:scale-105 transition-transform">Tempat Gambar 1</span>
                            </div>
                            <div className="aspect-[4/3] rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                                <span className="text-gray-400 font-medium group-hover:scale-105 transition-transform">Tempat Gambar 2</span>
                            </div>
                            <div className="aspect-[4/3] rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                                <span className="text-gray-400 font-medium group-hover:scale-105 transition-transform">Tempat Gambar 3</span>
                            </div>
                        </div>
                    </motion.div>

                </div>
                
                {/* CTA */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <a 
                        href="https://spmb.smkbn666.sch.id" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 bg-gradient-to-r ${major.gradient} text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:opacity-90 transition-all hover:scale-105`}
                    >
                        Daftar Jurusan {major.slug.toUpperCase()} <ArrowRight className="w-5 h-5" />
                    </a>
                </motion.div>
            </div>
        </div>
    );
};

export default MajorDetail;
