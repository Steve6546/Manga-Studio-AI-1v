import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useMangaStore } from '../src/state/mangaStore';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';

const StudioLayout: React.FC = () => {
  const { mangaId } = useParams<{ mangaId: string }>();
  const navigate = useNavigate();
  const { 
    currentMangaDocument, 
    isLoading, 
    error, 
    loadMangaDocument,
    clearCurrentMangaDocument
  } = useMangaStore();

  useEffect(() => {
    if (mangaId) {
      // Load document only if it's not already loaded or is a different one
      if (currentMangaDocument?.id !== mangaId) {
        loadMangaDocument(mangaId);
      }
    } else {
      // If no mangaId, something is wrong, go back to dashboard
      navigate('/dashboard');
    }
    
    // Clear the document from the store when the user navigates away from the studio
    return () => {
        // This logic can be tricky with React Router. A better approach might be
        // to clear it on the Dashboard's useEffect. For now, we rely on reloading.
    };

  }, [mangaId, loadMangaDocument, navigate, currentMangaDocument?.id]);

  if (isLoading && !currentMangaDocument) {
    return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader text="جاري تحميل الاستوديو..." />
    </div>;
  }

  if (error) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-red-400 p-4">
        حدث خطأ: {error}
    </div>;
  }

  if (!currentMangaDocument) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400 p-4">
        لا يوجد مشروع محدد.
    </div>;
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100" dir="rtl">
      <Sidebar project={currentMangaDocument} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 w-full h-full">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudioLayout;
