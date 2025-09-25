import React, { useState } from 'react';
import { Link, useParams, NavLink } from 'react-router-dom';
import { MangaDocument, Chapter, MangaPage } from '../types';
import { ChevronsUpDown, LayoutTemplate, BookText, BrainCircuit, FileText, PanelRightOpen, PanelLeftOpen, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface SidebarProps {
  project: MangaDocument;
}

const Sidebar: React.FC<SidebarProps> = ({ project }) => {
  const { chapterNumber, pageNumber } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>(() => {
    // Automatically open the current chapter on load
    const initial: Record<number, boolean> = {};
    if (chapterNumber) {
      initial[parseInt(chapterNumber, 10)] = true;
    }
    return initial;
  });

  const toggleChapter = (chapNum: number) => {
    setOpenChapters(prev => ({ ...prev, [chapNum]: !prev[chapNum] }));
  };

  const baseLinkClass = "flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition-all hover:text-slate-50 hover:bg-slate-700/50";
  const activeLinkClass = "bg-slate-700 text-slate-50";

  return (
    <aside className={cn(
        "flex-col border-l border-slate-800 bg-slate-900/50 transition-all duration-300 ease-in-out hidden md:flex",
        isCollapsed ? "w-16" : "w-72"
    )}>
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b border-slate-800 px-4">
                <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-slate-50 whitespace-nowrap">
                    <LayoutTemplate className="h-6 w-6 text-violet-400" />
                    {!isCollapsed && <span className="">Manga Studio AI</span>}
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
            </div>
            <div className={cn("flex-1 overflow-y-auto overflow-x-hidden", isCollapsed ? "px-2" : "px-4")}>
                <nav className="grid items-start text-sm font-medium">
                    <div className="py-2 space-y-2">
                        <h3 className={cn("font-semibold tracking-tight text-violet-400 flex items-center gap-2", isCollapsed && "justify-center")}>
                            {!isCollapsed ? project.title : <BookText className="h-5 w-5" />}
                        </h3>
                        <NavLink to={`/project/${project.id}/story`} className={({isActive}) => cn(baseLinkClass, isActive && activeLinkClass)}>
                            <FileText className="h-4 w-4"/>
                            {!isCollapsed && "تفاصيل القصة"}
                        </NavLink>
                        <NavLink to={`/project/${project.id}/editor`} className={({isActive}) => cn(baseLinkClass, isActive && activeLinkClass)}>
                            <FileText className="h-4 w-4"/>
                            {!isCollapsed && "محرر النص"}
                        </NavLink>
                        <NavLink to={`/project/${project.id}/memory`} className={({isActive}) => cn(baseLinkClass, isActive && activeLinkClass)}>
                            <BrainCircuit className="h-4 w-4"/>
                            {!isCollapsed && "ذاكرة القصة"}
                        </NavLink>
                    </div>

                    <div className="py-2 space-y-1 border-t border-slate-800">
                        <h3 className={cn("font-semibold tracking-tight text-violet-400 flex items-center gap-2", isCollapsed && "justify-center")}>
                             {!isCollapsed ? "الفصول والصفحات" : <BookText className="h-5 w-5" />}
                        </h3>
                        {project.chapters.map(chapter => (
                            <div key={chapter.chapterNumber}>
                                <button onClick={() => toggleChapter(chapter.chapterNumber)} className={cn(baseLinkClass, "w-full justify-between")}>
                                    <span className="flex items-center gap-3">
                                        <BookText className="h-4 w-4" />
                                        {!isCollapsed && `الفصل ${chapter.chapterNumber}`}
                                    </span>
                                    {!isCollapsed && <ChevronsUpDown className={`h-4 w-4 transition-transform ${openChapters[chapter.chapterNumber] ? 'rotate-180' : ''}`} />}
                                </button>
                                {openChapters[chapter.chapterNumber] && !isCollapsed && (
                                    <div className="mr-4 pl-4 border-r-2 border-slate-700 space-y-1 py-1">
                                        {chapter.pages.map(page => (
                                            <NavLink
                                                key={page.pageNumber}
                                                to={`/project/${project.id}/chapter/${chapter.chapterNumber}/page/${page.pageNumber}`}
                                                className={({isActive}) => cn(baseLinkClass, "text-xs", isActive && activeLinkClass)}
                                            >
                                                صفحة {page.pageNumber}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>
            </div>
             <div className="mt-auto p-4 border-t border-slate-800">
                <Link to="/dashboard" className={cn(baseLinkClass, isCollapsed && "justify-center")}>
                    <Home className="h-4 w-4" />
                    {!isCollapsed && "كل المشاريع"}
                </Link>
            </div>
        </div>
    </aside>
  );
};

export default Sidebar;
