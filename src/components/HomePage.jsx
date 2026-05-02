import { motion } from 'framer-motion';
import { Info, Box } from 'lucide-react';

const HomePage = ({ onNavigate }) => {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <section
        id="hero-section"
        className="bg-gradient-to-br from-[#d4edda] to-[#f0f9f4] p-8 md:p-12 rounded-[2.5rem] shadow-sm overflow-hidden relative"
      >
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#4a7c59] mb-4 leading-tight">
            Selamat Datang di <br /> Pengalaman Baru Museumku
          </h2>
          <p className="text-lg text-[#5a6b5e] leading-relaxed max-w-2xl">
            Jelajahi koleksi artefak berharga kami dengan teknologi Augmented Reality.
            Cukup arahkan kamera ke marker dan saksikan sejarah hidup di layar Anda.
          </p>
          <button
            id="hero-cta-scan"
            onClick={() => onNavigate('scan')}
            className="mt-8 bg-[#4a7c59] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#3d664a] transition-all active:scale-95"
          >
            Mulai Jelajah AR
          </button>
        </div>
        {/* Decorative element */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#a8d5ba] opacity-20 rounded-full blur-3xl"></div>
      </section>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* How to use card */}
        <div className="p-8 bg-white border border-emerald-100 rounded-[2rem] shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
            <Info size={24} className="text-[#4a7c59]" />
          </div>
          <h3 className="text-xl font-bold text-[#4a7c59] mb-3">Cara Menggunakan</h3>
          <ul className="text-gray-600 space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#d4edda] text-[#4a7c59] rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Buka menu <b>Scan AR</b> pada navigasi di atas.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#d4edda] text-[#4a7c59] rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>Izinkan peramban untuk mengakses kamera perangkat Anda.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#d4edda] text-[#4a7c59] rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Arahkan kamera ke <b>Marker Hiro</b> yang tersedia di area pameran.</span>
            </li>
          </ul>
        </div>

        {/* CTA card */}
        <div className="p-8 bg-[#4a7c59] text-white rounded-[2rem] shadow-lg flex flex-col justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Ingin tahu lebih lanjut?</h3>
            <p className="text-emerald-100/80 mb-6">Pelajari sejarah di balik koleksi kami yang terus bertambah.</p>
          </div>
          <div className="flex justify-between items-end relative z-10">
            <button
              id="home-cta-about"
              onClick={() => onNavigate('about')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-2 rounded-xl transition-all font-medium"
            >
              Lihat Detail
            </button>
            <Box size={80} className="text-white opacity-10 -mr-4 -mb-4 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
