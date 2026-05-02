import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Camera, Home, Info, Box } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Beranda', icon: <Home size={20} /> },
    { id: 'scan', label: 'Scan AR', icon: <Camera size={20} /> },
    { id: 'about', label: 'Tentang', icon: <Info size={20} /> },
  ];

  return (
    <nav id="main-navbar" className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-40 border-b border-emerald-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setActiveTab('home')}
          id="navbar-logo"
        >
          <div className="w-8 h-8 bg-[#a8d5ba] rounded-lg flex items-center justify-center">
            <Box size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl text-[#4a7c59]">Museumku</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-desktop-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 font-medium transition-colors ${
                activeTab === item.id
                  ? 'text-[#4a7c59]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          id="mobile-menu-toggle"
          className="md:hidden text-gray-600 p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-16 left-0 w-full bg-white border-b border-emerald-100 overflow-hidden md:hidden shadow-xl"
          >
            <div className="p-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-mobile-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#f0f9f4] text-[#4a7c59]'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
