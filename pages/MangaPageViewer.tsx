import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMangaStore } from '../src/state/mangaStore';
import { Panel, PanelLayoutType, AIOutputTypes, AIPromptInputs } from '../types';
import { googleAIController } from '../services/aiController';
import { Button } from '../components/ui/Button';
import Loader from '../components/Loader';
import { Card } from '../components/ui/Card';
import { Wand2, Edit, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import PanelEditModal from '../components/PanelEditModal';
import ImageEditorModal from '../components/ImageEditorModal';

const getGridLayout = (layout: PanelLayoutType) => {
    switch (layout) {
        case PanelLayoutType.ONE_TWO_ONE:
            return 'grid grid-cols-2 grid-rows-2 gap-4 h-full [&>*:first-child]:col-span-2 [&>*:last-child]:col-span-2';
        case PanelLayoutType.THREE_ROW:
            return 'grid grid-cols-1 grid-rows-3 gap-4 h-full';
        case PanelLayoutType.FOUR_GRID:
            return 'grid grid-cols-2 grid-rows-2 gap-4 h-full';
        case PanelLayoutType.TWO_BY_TWO:
        default:
            return 'grid grid-cols-2 grid-rows-2 gap-4 h-full';
    }
}

const MangaPageViewer: React.FC = () => {
    const { mangaId, chapterNumber, pageNumber } = useParams<{ mangaId: string; chapterNumber: string; pageNumber: string; }>();
    const navigate = useNavigate();
    const { currentMangaDocument, updatePanel } = useMangaStore();

    const [generatingPanels, setGeneratingPanels] = useState<Record<number, boolean>>({});
    const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
    const [imageEditorPanel, setImageEditorPanel] = useState<Panel | null>(null);

    const numChapter = parseInt(chapterNumber!, 10);
    const numPage = parseInt(pageNumber!, 10);
    
    const page = useMemo(() => {
        return currentMangaDocument?.chapters
            .find(c => c.chapterNumber === numChapter)?.pages
            .find(p => p.pageNumber === numPage);
    }, [currentMangaDocument, numChapter, numPage]);
    
    const totalPages = useMemo(() => {
        return currentMangaDocument?.chapters.find(c => c.chapterNumber === numChapter)?.pages.length || 1;
    }, [currentMangaDocument, numChapter]);

    const handleGenerateImage = async (panel: Panel) => {
        if (!currentMangaDocument) return;
        setGeneratingPanels(prev => ({ ...prev, [panel.panelOrder]: true }));
        const toastId = toast.loading(`Generating image for panel #${panel.panelOrder + 1}...`);
        try {
            const input: AIPromptInputs["generate_panel_image"] = {
                panelDescription: panel.description,
                styleKey: panel.styleKey,
                settings: panel.settings,
                storyMemory: currentMangaDocument.storyMemory,
            };
            const result = await googleAIController('generate_panel_image', input) as AIOutputTypes['generate_panel_image'];
            const updatedPanel: Panel = {
                ...panel,
                imageUrl: result.base64Image,
                imageGenerationPrompt: result.actualPrompt
            };
            await updatePanel(numChapter, numPage, updatedPanel, true);
            toast.success(`Image generated for panel #${panel.panelOrder + 1}!`, { id: toastId });
        } catch (e: any) {
            toast.error(`Failed to generate image: ${e.message}`, { id: toastId });
        } finally {
            setGeneratingPanels(prev => ({ ...prev, [panel.panelOrder]: false }));
        }
    };

    const navigatePage = (direction: 'next' | 'prev') => {
        const newPageNumber = direction === 'next' ? numPage + 1 : numPage - 1;
        if (newPageNumber > 0 && newPageNumber <= totalPages) {
            navigate(`/project/${mangaId}/chapter/${numChapter}/page/${newPageNumber}`);
        }
    };
    
    if (!currentMangaDocument) return <Loader text="Loading page..." />;
    if (!page) return <div className="text-center text-red-400">Page not found.</div>;

    return (
        <>
            {editingPanel && <PanelEditModal panel={editingPanel} isOpen={!!editingPanel} onClose={() => setEditingPanel(null)} />}
            {imageEditorPanel && <ImageEditorModal panel={imageEditorPanel} isOpen={!!imageEditorPanel} onClose={() => setImageEditorPanel(null)} />}
            <div className="h-full flex flex-col gap-4">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-violet-400">Chapter {numChapter} - Page {numPage}</h1>
                        <p className="text-slate-400">Layout: {page.layout}</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={() => navigatePage('prev')} disabled={numPage <= 1} variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                        <span className="text-sm font-medium text-slate-300">{numPage} / {totalPages}</span>
                        <Button onClick={() => navigatePage('next')} disabled={numPage >= totalPages} variant="outline" size="icon"><ArrowRight className="h-4 w-4" /></Button>
                    </div>
                </header>

                <div className="flex-grow bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className={getGridLayout(page.layout)}>
                        {page.panels.sort((a,b) => a.panelOrder - b.panelOrder).map(panel => (
                            <Card key={panel.panelOrder} className="relative group overflow-hidden bg-slate-800 flex items-center justify-center">
                                {generatingPanels[panel.panelOrder] && <Loader text="Generating..." />}
                                {!generatingPanels[panel.panelOrder] && panel.imageUrl ? (
                                    <img src={`data:image/jpeg;base64,${panel.imageUrl}`} alt={`Panel ${panel.panelOrder + 1}`} className="w-full h-full object-cover"/>
                                ) : !generatingPanels[panel.panelOrder] && (
                                    <div className="text-center text-slate-500 p-2">
                                        <p className="text-xs">{panel.description}</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <Button size="sm" onClick={() => handleGenerateImage(panel)} isLoading={generatingPanels[panel.panelOrder]}>
                                        <Wand2 className="mr-2 h-4 w-4"/> Regenerate
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => setEditingPanel(panel)}>
                                        <Edit className="mr-2 h-4 w-4"/> Edit Panel
                                    </Button>
                                     {panel.imageUrl && (
                                        <Button size="sm" variant="secondary" onClick={() => setImageEditorPanel(panel)}>
                                            <Wand2 className="mr-2 h-4 w-4"/> Edit Image
                                        </Button>
                                    )}
                                </div>
                                 <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{panel.panelOrder + 1}</div>
                                {panel.caption && <div className="absolute bottom-1 left-1 right-1 bg-white/80 text-black text-xs p-1 text-center rounded">{panel.caption}</div>}
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MangaPageViewer;
