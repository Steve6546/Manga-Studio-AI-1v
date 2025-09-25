import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { useMangaStore } from '../src/state/mangaStore';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Home, Pencil, BookOpen, BrainCircuit, ChevronLeft, Image, Share2, BookPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar: React.FC = () => {
    const { mangaId } = useParams<{ mangaId: string; chapterNumber?: string; pageNumber?: string;}>();
    const { currentMangaDocument, addChapter } = useMangaStore();
    const navigate = useNavigate();

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-slate-50 hover:bg-slate-800",
            isActive && "bg-slate-800 text-slate-50"
        );

    const firstChapter = currentMangaDocument?.chapters?.[0];
    const firstPage = firstChapter?.pages?.[0];
    const initialViewerPath = firstChapter && firstPage ? `/project/${mangaId}/chapter/${firstChapter.chapterNumber}/page/${firstPage.pageNumber}` : '#';

    const handleAddNewChapter = async () => {
        const title = window.prompt("Enter new chapter title:");
        if (title && title.trim()) {
            const result = await addChapter(title.trim());
            if (result) {
                // Navigate to the new chapter's first page
                navigate(`/project/${mangaId}/chapter/${result.newChapterNumber}/page/${result.newPageNumber}`);
            }
        } else if (title !== null) { // User clicked OK with empty string
            toast.error("Chapter title cannot be empty.");
        }
    };


    return (
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900 p-4">
            <div className="flex flex-col gap-2 flex-grow">
                <div className="mb-4">
                     <h2 className="text-lg font-semibold truncate text-violet-400">{currentMangaDocument?.title || 'Loading...'}</h2>
                     <p className="text-xs text-slate-500">Manga Studio</p>
                </div>
               
                <nav className="grid items-start gap-1 text-sm font-medium">
                     <NavLink to={`/project/${mangaId}/editor`} className={navLinkClass}>
                        <Pencil className="h-4 w-4" />
                        Narrative Editor
                    </NavLink>
                    <NavLink to={`/project/${mangaId}/story`} className={navLinkClass}>
                        <BookOpen className="h-4 w-4" />
                        Story Overview
                    </NavLink>
                     <NavLink to={`/project/${mangaId}/memory`} className={navLinkClass}>
                        <BrainCircuit className="h-4 w-4" />
                        Story Memory
                    </NavLink>
                    <NavLink to={`/project/${mangaId}/graph`} className={navLinkClass}>
                        <Share2 className="h-4 w-4" />
                        Story Graph
                    </NavLink>
                     <NavLink to={initialViewerPath} className={navLinkClass} end={false}>
                        <Image className="h-4 w-4" />
                        Page Viewer
                    </NavLink>
                </nav>

                <div className="mt-4 border-t border-slate-800 pt-4">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleAddNewChapter}>
                        <BookPlus className="h-4 w-4 mr-2" />
                        New Chapter
                    </Button>
                </div>
            </div>
             <div className="mt-auto">
                <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;