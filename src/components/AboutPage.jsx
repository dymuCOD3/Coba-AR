import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

const AboutPage = () => {
  return (
    <motion.div
      key="about"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-emerald-50 max-w-3xl mx-auto"
    >
      <div className="inline-block p-3 bg-emerald-50 rounded-2xl mb-6">
        <Info size={32} className="text-[#4a7c59]" />
      </div>
      <h2 id="about-title" className="text-3xl font-bold text-[#4a7c59] mb-6">Tentang Museumku AR</h2>
      <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
        <p>
          <b>Museumku AR</b> adalah platform inovatif yang menggabungkan pelestarian sejarah dengan teknologi modern. Tujuan kami adalah membuat edukasi museum menjadi lebih interaktif dan menarik bagi generasi digital.
        </p>
        <p>
          Aplikasi ini dibangun menggunakan <b>React.js</b> dan <b>AR.js</b>, memungkinkan pengalaman AR berbasis web tanpa perlu mengunduh aplikasi pihak ketiga di ponsel pintar Anda.
        </p>
      </div>

      <div className="mt-10 pt-8 border-t border-emerald-50 grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-bold text-[#4a7c59] text-sm uppercase tracking-wider mb-2">Versi Aplikasi</h4>
          <p className="text-gray-500">v1.0.0 (Beta)</p>
        </div>
        <div>
          <h4 className="font-bold text-[#4a7c59] text-sm uppercase tracking-wider mb-2">Teknologi</h4>
          <p className="text-gray-500">React + Tailwind + AR.js</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
