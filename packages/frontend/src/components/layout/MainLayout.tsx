import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Drawer from './Drawer';
import './MainLayout.css';

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="main-layout">
      <TopBar onMenuToggle={() => setDrawerOpen(!drawerOpen)} />
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="main-content">
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
