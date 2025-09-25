import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useMangaStore } from '../src/state/mangaStore';
import Loader from '../components/Loader';

const StudioLayout: React.FC = () => {
    const { mangaId } = useParams<{ mangaId: string }>();
    const navigate = useNavigate();
    const { loadMangaDocument, currentMangaDocument, isLoading, error } = useMangaStore();

    useEffect(() => {
        if (mangaId) {
            if (currentMangaDocument?.id !== mangaId) {
              loadMangaDocument(mangaId);
            }
        } else {
            navigate('/dashboard');
        }
    }, [mangaId, loadMangaDocument, navigate, currentMangaDocument?.id]);

    if (isLoading && !currentMangaDocument) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader text="Loading Project..." />
            </div>
        );
    }

    if (error) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
                Error: {error}
            </div>
        );
    }
    
    if (!currentMangaDocument) {
        return null; // or redirect, error handled above
    }

    return (
        <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
            <Sidebar />
            <main className="flex-grow p-6 md:p-8 lg:p-10 overflow-y-auto" style={{ maxHeight: '100vh' }}>
                 <Outlet />
            </main>
        </div>
    );
};

export default StudioLayout;
