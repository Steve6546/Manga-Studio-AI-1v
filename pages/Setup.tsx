import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { 
    ArtStyle, Environment, MangaDocument, StoryMemory, AIPromptInputs, Chapter, MangaPage, Panel,
    PanelLayoutType, VisualStyleKey, AIOutputTypes
} from '../types';
import { ART_STYLES_OPTIONS, ENVIRONMENT_OPTIONS, DEFAULT_PANEL_LAYOUT, DEFAULT_PANELS_PER_PAGE, APP_TITLE, DEFAULT_SCENE_SETTINGS } from '../constants';
import { saveMangaDocument, getMangaDocument } from '../services/db';
import { googleAIController } from '../services/aiController'; 
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const getDefaultStoryMemory = (): StoryMemory => ({
  characters: [],
  world: { places: [], majorEvents: [], timelineNotes: '', lore: '' },
  theme: '',
  overallStyleNotes: '',
});

const INITIAL_PAGES_IN_NEW_CHAPTER = 3;

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { mangaId } = useParams<{ mangaId: string }>(); 

  const [storyIdea, setStoryIdea] = useState('');
  const [title, setTitle] = useState(''); 
  const [artStyle, setArtStyle] = useState<ArtStyle>(ArtStyle.ANIME); 
  const [environment, setEnvironment] = useState<Environment | ''>(''); 

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentMangaDoc, setCurrentMangaDoc] = useState<MangaDocument | null>(null);

  useEffect(() => {
    const loadMangaData = async () => {
      if (mangaId) {
        setIsLoadingData(true);
        const loadingToast = toast.loading("جاري تحميل بيانات المشروع...");
        try {
          const data = await getMangaDocument(mangaId);
          if (data) {
            setCurrentMangaDoc(data);
            setTitle(data.title);
            setArtStyle(data.artStyle);
            setEnvironment(data.environment || '');
            setStoryIdea(data.summary || data.content || `مشروع مانغا قائم بعنوان: ${data.title}`);
            document.title = `تعديل: ${data.title} - ${APP_TITLE}`;
            toast.success("تم تحميل البيانات بنجاح.", { id: loadingToast });
          } else {
             throw new Error(`لم يتم العثور على مشروع مانغا بالمعرّف: ${mangaId}`);
          }
        } catch (e: any) {
          console.error("Failed to load manga data:", e);
          toast.error(e.message, { id: loadingToast });
          navigate('/dashboard');
        } finally {
          setIsLoadingData(false);
        }
      } else {
        document.title = `مشروع مانغا جديد - ${APP_TITLE}`;
      }
    };
    loadMangaData();
     return () => { document.title = APP_TITLE; };
  }, [mangaId, navigate]);

  const validateForm = (): boolean => {
    if (!storyIdea.trim()) {
      toast.error("فكرة القصة مطلوبة.");
      return false;
    }
    if (!title.trim() && !mangaId) { 
      toast.error("عنوان المشروع مطلوب.");
      return false;
    }
    if (!artStyle) {
      toast.error("النمط الفني مطلوب.");
      return false;
    }
    return true;
  };

  const handleStartFirstChapter = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);
    const toastId = toast.loading("جاري إعداد الفصل الأول...", { duration: Infinity });

    try {
      const initialStoryMemory = currentMangaDoc?.storyMemory || getDefaultStoryMemory();
      const outlineInput: AIPromptInputs["generate_manga_page_outline"] = {
        storyIdea: storyIdea.trim(), artStyle, environment: environment || undefined,
        targetPanelCount: DEFAULT_PANELS_PER_PAGE[DEFAULT_PANEL_LAYOUT], storyMemory: initialStoryMemory,
      };
      const pageOutline = await googleAIController("generate_manga_page_outline", outlineInput) as AIOutputTypes["generate_manga_page_outline"];
      toast.loading("تم إنشاء المخطط، جاري توليد عناصر اللوحات...", { id: toastId });

      let updatedStoryMemory = { ...initialStoryMemory };
      // Update story memory with initial data from outline
      // ... (logic for updating characters, theme, etc.)

      const panelsForPage1: Panel[] = [];
      for (const panelDesc of pageOutline.panelDescriptions) {
        const elements = await googleAIController("generate_panel_elements", {
          panelDescription: panelDesc.description,
          storyMemory: updatedStoryMemory,
          panelOrder: panelDesc.panelOrder,
        }) as AIOutputTypes["generate_panel_elements"];
        panelsForPage1.push({
          panelOrder: panelDesc.panelOrder, description: panelDesc.description,
          caption: elements.caption, dialogue: elements.dialogue,
          styleKey: artStyle as VisualStyleKey,
          settings: { ...DEFAULT_SCENE_SETTINGS },
        });
      }
      panelsForPage1.sort((a,b) => a.panelOrder - b.panelOrder);

      const finalTitle = title.trim() || storyIdea.substring(0, 50);
      const mangaDocIdToSave = mangaId || Date.now().toString();
      
      const newMangaPage1: MangaPage = {
        pageNumber: 1,
        layout: pageOutline.pageLayoutSuggestion || DEFAULT_PANEL_LAYOUT,
        panels: panelsForPage1,
      };
      
      let chaptersToSave: Chapter[];
      // Logic to create/update chapters
      if (currentMangaDoc) { /* update existing */
         chaptersToSave = [...currentMangaDoc.chapters];
         // Complex logic to find and update chapter 1, page 1
      } else { /* create new */
         const placeholderPages: MangaPage[] = Array.from({ length: INITIAL_PAGES_IN_NEW_CHAPTER - 1 }, (_, i) => ({
             pageNumber: i + 2, layout: DEFAULT_PANEL_LAYOUT, panels: []
         }));
         chaptersToSave = [{ chapterNumber: 1, title: `الفصل الأول`, pages: [newMangaPage1, ...placeholderPages] }];
      }
      
      const mangaDocumentData = {
        title: finalTitle, artStyle, environment: environment as Environment,
        summary: pageOutline.centralConflictHint || storyIdea.substring(0, 200),
        visualStyleKey: artStyle as VisualStyleKey, chapters: chaptersToSave, storyMemory: updatedStoryMemory,
      };

      await saveMangaDocument(mangaDocIdToSave, mangaDocumentData, currentMangaDoc?.createdAt);
      toast.success("تم إعداد المشروع بنجاح! يتم توجيهك...", { id: toastId });
      navigate(`/project/${mangaDocIdToSave}/chapter/1/page/1`);

    } catch (e: any) {
      console.error("Failed to start first chapter:", e);
      toast.error(`فشل الإعداد: ${e.message || String(e)}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoadingData && mangaId) {
    return <div className="flex justify-center items-center h-60"><Loader /></div>;
  }

  return (
    <Card className="max-w-3xl mx-auto bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-2xl text-violet-400">
          {mangaId ? 'تعديل إعدادات المشروع' : 'ابدأ مشروع مانغا جديد'}
        </CardTitle>
        <CardDescription>
          املأ التفاصيل الأساسية أدناه ليقوم الذكاء الاصطناعي بإنشاء مخطط للصفحة الأولى.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
         <div>
            <Label htmlFor="storyIdea">فكرة القصة الرئيسية</Label>
            <Textarea
                id="storyIdea" value={storyIdea} onChange={(e) => setStoryIdea(e.target.value)}
                placeholder="مثال: مغامرات فتى اسمه مانو يكتشف جزيرة ثلجية..."
                rows={4} required disabled={isProcessing}
            />
         </div>
         <div>
            <Label htmlFor="title">عنوان مشروع المانغا</Label>
            <Input
                id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مانو وأسطورة جبل الجليد"
                disabled={isProcessing}
            />
         </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
              <Label>النمط الفني</Label>
              <Select value={artStyle} onValueChange={(v) => setArtStyle(v as ArtStyle)} disabled={isProcessing}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{ART_STYLES_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
          </div>
          <div>
              <Label>البيئة العامة (اختياري)</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as Environment)} disabled={isProcessing}>
                  <SelectTrigger><SelectValue placeholder="اختر بيئة..." /></SelectTrigger>
                  <SelectContent>{ENVIRONMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
            type="button" onClick={handleStartFirstChapter} isLoading={isProcessing}
            disabled={!storyIdea.trim() || isProcessing} size="lg" className="w-full"
        >
            {mangaId ? 'حفظ وبدء الاستوديو' : `ابدأ الفصل الأول`}
        </Button>
        <Button
            type="button" onClick={() => navigate('/dashboard')} variant="secondary"
            className="w-full" disabled={isProcessing}
        >
           العودة إلى لوحة التحكم
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SetupPage;
