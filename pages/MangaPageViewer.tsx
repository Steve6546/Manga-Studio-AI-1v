import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMangaStore } from '../src/state/mangaStore';
import { googleAIController } from '../services/aiController';
import { 
    Chapter, MangaPage, Panel, AIPromptInputs, AIOutputTypes, SpeechBubble
} from '../types';
import { Button } from '../components/ui/Button';
import Loader from '../components/Loader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Image as ImageIcon, Sparkles, Wand2, Edit, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import PanelEditModal from '../components/PanelEditModal';

const MangaPageViewer: React.FC = () => {
  const { chapterNumber, pageNumber } = useParams<{ chapterNumber: string; pageNumber: string; }>();
  const navigate = useNavigate();

  const {
    currentMangaDocument: project,
    isLoading: isStoreLoading,
    updatePanel,
  } = useMangaStore();

  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState<MangaPage | null>(null);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);

  const numChapter = parseInt(chapterNumber || "1", 10);
  const numPage = parseInt(pageNumber || "1", 10);

  useEffect(() => {
    if (project) {
        const chapter = project.chapters.find(ch => ch.chapterNumber === numChapter);
        setCurrentChapter(chapter || null);
        const page = chapter?.pages.find(p => p.pageNumber === numPage);
        setCurrentPage(page || null);
        if (!page) {
            toast.error(`الصفحة ${numPage} غير موجودة في الفصل ${numChapter}.`);
        }
    }
  }, [project, numChapter, numPage]);
  
  const handleGeneratePanelImage = async (panel: Panel) => {
    if (!project) return;
    
    const toastId = toast.loading(`جاري توليد صورة للوحة #${panel.panelOrder + 1}...`, { duration: Infinity });
    updatePanel(numChapter, numPage, { ...panel, isGeneratingImage: true, imageError: undefined });

    try {
      const panelCharacters = project.storyMemory.characters
            .filter(char => panel.description.toLowerCase().includes(char.name.toLowerCase()));

      const imageInput: AIPromptInputs["generate_panel_image"] = {
        panelDescription: panel.description,
        styleKey: panel.styleKey || project.visualStyleKey,
        settings: panel.settings,
        storyMemory: project.storyMemory,
        charactersInPanel: panelCharacters.map(c=>({name: c.name, description: c.description})),
      };
      
      const result = await googleAIController("generate_panel_image", imageInput) as AIOutputTypes["generate_panel_image"];
      
      await updatePanel(numChapter, numPage, { 
          ...panel, 
          imageUrl: `data:image/jpeg;base64,${result.base64Image}`, 
          imagePrompt: result.actualPrompt, 
          timestamp: Date.now(),
          isGeneratingImage: false 
      }, true);
      toast.success(`تم توليد صورة اللوحة #${panel.panelOrder + 1} بنجاح!`, { id: toastId });

    } catch (e: any) {
      console.error(`Failed to generate image for panel ${panel.panelOrder}:`, e);
      const errorMsg = e.message || "فشل توليد الصورة.";
      await updatePanel(numChapter, numPage, { ...panel, imageError: errorMsg, isGeneratingImage: false }, true);
      toast.error(`فشل توليد صورة اللوحة #${panel.panelOrder + 1}: ${errorMsg}`, { id: toastId });
    }
  };
  
  if (isStoreLoading && !project) {
    return <Loader text="جاري تحميل بيانات الصفحة..." />;
  }
  
  if (!project || !currentPage) {
    return <div className="text-center text-slate-400">لم يتم العثور على بيانات الصفحة.</div>;
  }

  const gridLayoutClasses: Record<string, string> = {
      'grid_2x3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      'grid_1x3_vertical': 'grid-cols-1 lg:grid-cols-3',
      'grid_2x2': 'grid-cols-1 sm:grid-cols-2',
      'splash_full_page': 'grid-cols-1',
      'custom': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };
  
  const renderSpeechBubble = (bubble: SpeechBubble, index: number) => {
    const bubbleStyles = {
        normal: 'bg-white text-black',
        shout: 'bg-red-500 text-white font-bold',
        thought: 'border-2 border-dashed border-gray-400 text-gray-300 bg-transparent',
        whisper: 'bg-gray-300 text-gray-700 italic',
        narration: 'bg-slate-800 text-slate-300 border border-slate-600'
    };
    return (
        <div key={index} className="text-right">
            {bubble.characterName && <span className="font-bold text-violet-400 text-sm">{bubble.characterName}: </span>}
            <span className={`p-2 rounded-lg text-xs inline-block ${bubbleStyles[bubble.style || 'normal']}`}>
                {bubble.text}
            </span>
        </div>
    );
  };

  return (
    <>
      {editingPanel && <PanelEditModal panel={editingPanel} isOpen={!!editingPanel} onClose={() => setEditingPanel(null)} />}
      <div className="w-full h-full flex flex-col">
        <header className="mb-6">
            <h1 className="text-3xl font-bold text-violet-400">الفصل {numChapter} - صفحة {numPage}</h1>
            <p className="text-slate-400">{currentChapter?.title}</p>
        </header>
        
        <div className="flex-grow overflow-y-auto pr-2">
            <div className={`grid ${gridLayoutClasses[currentPage.layout] || 'grid-cols-3'} gap-4`}>
            {currentPage.panels.sort((a,b)=> a.panelOrder - b.panelOrder).map(panel => (
                <Card key={panel.panelOrder} className="bg-slate-900/70 border-slate-800 flex flex-col">
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm text-slate-300">لوحة #{panel.panelOrder + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 flex-grow flex flex-col gap-3">
                        <div className="group relative w-full aspect-square bg-slate-800 rounded-md flex items-center justify-center overflow-hidden">
                           {panel.isGeneratingImage ? <Loader /> :
                            panel.imageUrl ? <img src={panel.imageUrl} alt={`Panel ${panel.panelOrder + 1}`} className="w-full h-full object-cover"/> :
                            panel.imageError ? <p className="text-xs text-red-400 p-2 text-center">{panel.imageError}</p> :
                            <ImageIcon className="h-10 w-10 text-slate-600"/>
                           }
                           <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="sm" onClick={() => handleGeneratePanelImage(panel)} isLoading={panel.isGeneratingImage}>
                                    <Wand2 className="ml-2 h-4 w-4" />
                                    توليد الصورة
                                </Button>
                           </div>
                        </div>
                        <div className="text-xs text-slate-400 space-y-2">
                            <p className="font-semibold text-slate-300">الوصف:</p>
                            <p className="whitespace-pre-wrap break-words max-h-20 overflow-y-auto text-sm">{panel.description}</p>
                        </div>
                         {panel.dialogue && panel.dialogue.length > 0 && (
                            <div className="text-xs text-slate-200 mt-1.5 space-y-2 max-h-28 overflow-y-auto">
                               {panel.dialogue.map(renderSpeechBubble)}
                            </div>
                         )}
                    </CardContent>
                    <CardFooter className="p-3 border-t border-slate-800">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingPanel(panel)}>
                            <Edit className="ml-2 h-4 w-4"/>
                            تعديل اللوحة
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            </div>
        </div>
      </div>
    </>
  );
};

export default MangaPageViewer;
