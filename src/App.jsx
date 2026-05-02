import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ARScanner from './components/ARScanner';
import AboutPage from './components/AboutPage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 font-sans selection:bg-[#a8d5ba] selection:text-[#4a7c59]">
      <AnimatePresence>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <div className="pt-20 pb-10 px-4 max-w-6xl mx-auto">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="mt-4 min-h-[60vh]" id="main-content">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <HomePage onNavigate={setActiveTab} />
              )}

              {activeTab === 'scan' && (
                <ARScanner key="scan" />
              )}

              {activeTab === 'about' && (
                <AboutPage />
              )}
            </AnimatePresence>
          </main>

          <footer className="mt-16 text-center text-gray-400 text-sm py-8 border-t border-emerald-50">
            <div className="flex justify-center gap-6 mb-4 text-[#4a7c59]/60">
              <span className="hover:text-[#4a7c59] cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-[#4a7c59] cursor-pointer transition-colors">Terms of Service</span>
            </div>
            &copy; 2024 Museumku Digital Experience. <br className="md:hidden" /> Dibuat dengan &hearts; untuk Sejarah.
          </footer>
        </div>
      )}
    </div>
  );
}
