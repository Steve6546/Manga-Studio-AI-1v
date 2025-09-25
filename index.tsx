import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import MainNav from './components/MainNav';
import DashboardPage from './pages/Dashboard';
import SetupPage from './pages/Setup';
import EditorPage from './pages/Editor';
import StoryViewPage from './pages/StoryViewPage';
import StoryMemoryPage from './pages/StoryMemoryPage';
import StoryGraphPage from './pages/StoryGraphPage';
// FIX: Corrected import path
import MangaPageViewer from './pages/MangaPageViewer';
import StudioLayout from './layouts/StudioLayout';
// FIX: Corrected import path
import { APP_TITLE } from './constants';


// Layout for general pages like Dashboard and Setup
const GeneralLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
    <MainNav />
    <main className="flex-grow container mx-auto px-4 py-8">
      <AnimatedOutlet />
    </main>
    <footer className="text-center py-4 text-sm text-slate-500 border-t border-slate-800">
      <p>&copy; {new Date().getFullYear()} {APP_TITLE}. جميع الحقوق محفوظة.</p>
    </footer>
  </div>
);

// Animated Outlet for page transitions
const AnimatedOutlet: React.FC = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Routes with the general, simple layout */}
        <Route element={<GeneralLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="setup/:mangaId" element={<SetupPage />} />
        </Route>

        {/* Studio routes with the new, integrated sidebar layout */}
        <Route path="/project/:mangaId" element={<StudioLayout />}>
            <Route path="editor" element={<EditorPage />} />
            <Route path="story" element={<StoryViewPage />} />
            <Route path="memory" element={<StoryMemoryPage />} />
            <Route path="graph" element={<StoryGraphPage />} />
            <Route path="chapter/:chapterNumber/page/:pageNumber" element={<MangaPageViewer />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: 'bg-slate-800 text-white border border-slate-700',
          success: {
            iconTheme: {
              primary: '#34d399', // emerald-400
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171', // red-400
              secondary: 'white',
            },
          },
        }}
      />
    </HashRouter>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
} else {
  console.error("Root element not found");
}