import React, { useState, useEffect } from 'react';

export default function SidebarLayout({ children, menuItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  // Ekranni chapdan o'ngga surishni sezish (Touch listener)
  useEffect(() => {
    const handleTouchStart = (e) => {
      setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
      if (!touchStartX) return;
      const touchEndX = e.changedTouches[0].clientX;
      const distance = touchEndX - touchStartX;

      // Ekranning chap chetidan (50px ichida) o'ngga qarab 70px dan ortiq surilsa ochiladi
      if (touchStartX < 50 && distance > 70) {
        setIsOpen(true);
      }
      // Ochiq turganda chapga 70px surilsa yopiladi
      if (isOpen && distance < -70) {
        setIsOpen(false);
      }
      setTouchStartX(null);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartX, isOpen]);

  return (
    <div className="relative min-h-screen bg-gray-50 flex">
      {/* Qoraytirilgan fon (Overlay) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
        />
      )}

      {/* Yon Menyu (Sidebar) */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 border-b font-bold text-lg text-blue-600 flex justify-between items-center">
          <span>Eduflow CRM</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 text-xl">&times;</button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems}
        </nav>
      </div>

      {/* Asosiy kontent maydoni */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b p-3 flex items-center gap-3">
          <button onClick={() => setIsOpen(true)} className="p-2 border rounded-md text-gray-600">
            ☰
          </button>
          <span className="font-semibold text-gray-800">Eduflow CRM</span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}