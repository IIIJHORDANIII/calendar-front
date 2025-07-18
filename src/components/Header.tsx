import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Church } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Início', href: '/', isExternal: false },
    { name: 'Recursos', href: '/#features', isExternal: false },
    { name: 'Documentação', href: '/documentation', isExternal: false },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname === href;
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        isScrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-white/20 shadow-lg'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link to="/" className="flex items-center gap-4">
              <Church className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Sistema Igreja
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.isExternal ? (
                  <a
                    href={item.href}
                    className={`transition-colors font-medium ${
                      isActive(item.href)
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className={`transition-colors font-medium ${
                      isActive(item.href)
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </motion.div>
            ))}
          </nav>

          {/* CTA Button */}
          <motion.div
            className="hidden md:block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 py-3.5 ml-4 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer border-none relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30"
            >
              Login
            </Link>
          </motion.div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 space-y-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-lg mt-2">
              {navItems.map((item) => (
                <div key={item.name}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      className={`block p-3 rounded transition-colors ${
                        isActive(item.href)
                          ? 'text-blue-500 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className={`block p-3 rounded transition-colors ${
                        isActive(item.href)
                          ? 'text-blue-500 dark:text-blue-400 bg-gray-100 dark:bg-gray-700'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              <Link
                to="/login"
                className="w-full mt-4 inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer border-none relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header; 