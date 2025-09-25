import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import { 
  MangaDocument, ArtStyle, Panel, CharacterMemory, StoryMemory, 
  Chapter, MangaPage, WorldPlace, WorldBuildingSuggestions 
// FIX: Corrected import path
} from '../types';
// FIX: Corrected import path
import { googleAIController } from '../services/aiController';
import { saveMangaDocument, getMangaDocument } from '../services/db';
// FIX: Corrected import path
import { ART_STYLES_OPTIONS, DEFAULT_SCENE_SETTINGS, DEFAULT_PANEL_LAYOUT } from '../constants';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Badge } from '../components/ui/Badge';
import Loader from '../components/Loader';
// FIX: Imported X from lucide-react
import { Wand2, Save, BookImage, Brain, ArrowLeft, ArrowRight, Trash2, PlusCircle, X } from 'lucide-react';

const SetupPage: React.FC = () => {
    const { mangaId } = useParams<{ mangaId?: string }>();
    const navigate = useNavigate();
    const isEditing = !!mangaId;

    // Wizard State
    const [step, setStep] = useState(1);
    
    // Core Info State (Step 1)
    const [title, setTitle] = useState('');
    const [artStyle, setArtStyle] = useState<ArtStyle>(ArtStyle.ANIME);
    const [storyIdea, setStoryIdea] = useState('');
    
    // World Building State (Step 2)
    const [characters, setCharacters] = useState<(Omit<CharacterMemory, 'id'|'relationships'|'history'> & { id?: string })[]>([]);
    const [places, setPlaces] = useState<(Omit<WorldPlace, 'id'> & { id?: string })[]>([]);
    const [themes, setThemes] = useState<string[]>([]);
    const [newTheme, setNewTheme] = useState('');

    // Loading & Doc State
    const [isLoading, setIsLoading] = useState(isEditing);
    const [isGenerating, setIsGenerating] = useState(false);
    const [existingDoc, setExistingDoc] = useState<MangaDocument | null>(null);

    const handleAddTheme = () => {
        const trimmedTheme = newTheme.trim();
        if (!trimmedTheme) return;

        if (themes.some(theme => theme.toLowerCase() === trimmedTheme.toLowerCase())) {
            toast.error("هذا الموضوع موجود بالفعل.");
            return;
        }

        setThemes([...themes, trimmedTheme]);
        setNewTheme('');
    };

    const loadExistingDocument = useCallback(async () => {
        if (!mangaId) return;
        setIsLoading(true);
        try {
            const doc = await getMangaDocument(mangaId);
            if (doc) {
                setTitle(doc.title);
                setArtStyle(doc.artStyle);
                setStoryIdea(doc.summary || '');
                setCharacters(doc.storyMemory.characters);
                setPlaces(doc.storyMemory.world.places);
                setThemes([doc.storyMemory.theme]);
                setExistingDoc(doc);
            } else {
                toast.error("لم يتم العثور على المشروع.");
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error("فشل تحميل المشروع.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [mangaId, navigate]);

    useEffect(() => {
        if (isEditing) {
            loadExistingDocument();
        }
    }, [isEditing, loadExistingDocument]);

    const handleBrainstorm = async () => {
        if (!storyIdea.trim()) {
            toast.error("يرجى كتابة فكرة القصة أولاً.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading("...الذكاء الاصطناعي يقوم بالعصف الذهني");
        try {
            const result: WorldBuildingSuggestions = await googleAIController('generate_world_memory_foundation', { title, storyIdea });
            setCharacters(prev => [...prev, ...result.suggestedCharacters]);
            setPlaces(prev => [...prev, ...result.suggestedPlaces]);
            setThemes(prev => [...new Set([...prev, ...result.suggestedThemes])]); // Avoid duplicates
            toast.success("تم توليد الاقتراحات!", { id: toastId });
        } catch (e: any) {
            toast.error(e.message || "فشل توليد الاقتراحات.", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateProject = async () => {
        if (!title.trim() || !storyIdea.trim()) {
            toast.error("يجب إدخال العنوان وفكرة القصة قبل المتابعة.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading("جاري إنشاء المشروع وتوليد الصفحة الأولى...");
        
        try {
            const finalMemory: StoryMemory = {
                theme: themes.join(', '),
                overallStyleNotes: `A ${artStyle} story.`,
                characters: characters.map(char => ({ id: uuidv4(), ...char, relationships: [], history: [] })),
                world: {
                    places: places.map(p => ({ id: uuidv4(), ...p })),
                    majorEvents: [],
                    timelineNotes: '',
                    lore: ''
                }
            };

            const outline = await googleAIController('generate_manga_page_outline', {
                storyIdea,
                artStyle,
                storyMemory: finalMemory,
            });

            const panels: Panel[] = outline.panelDescriptions.map(p => ({
                panelOrder: p.panelOrder,
                description: p.description,
                settings: DEFAULT_SCENE_SETTINGS,
                styleKey: artStyle
            }));

            const firstPage: MangaPage = { pageNumber: 1, layout: outline.pageLayoutSuggestion || DEFAULT_PANEL_LAYOUT, panels };
            const firstChapter: Chapter = { chapterNumber: 1, title: "Chapter 1", pages: [firstPage] };
            
            const docData = {
                title, artStyle, summary: storyIdea, visualStyleKey: artStyle,
                storyMemory: finalMemory, chapters: [firstChapter], content: storyIdea, contentHistory: [],
                environment: 'city' as any, // Placeholder, as it's removed from UI
            };

            const newMangaId = mangaId || uuidv4();
            await saveMangaDocument(newMangaId, docData, existingDoc?.createdAt);
            toast.success("تم إنشاء المشروع بنجاح!", { id: toastId });
            navigate(`/project/${newMangaId}/chapter/1/page/1`);

        } catch (e: any) {
            toast.error(e.message || "فشل إنشاء المشروع.", { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleSaveSettings = async () => {
        if (!title.trim()) { toast.error("العنوان مطلوب."); return; }
        setIsGenerating(true);
        try {
            const finalMemory: StoryMemory = {
                theme: themes.join(', '),
                overallStyleNotes: `A ${artStyle} story.`,
                characters: characters.map(char => ({ id: char.id || uuidv4(), ...char, relationships: [], history: [] })),
                world: { ...existingDoc!.storyMemory.world, places: places.map(p => ({ id: p.id || uuidv4(), ...p }))},
            };

            await saveMangaDocument(mangaId!, {
                ...existingDoc!, title, artStyle, summary: storyIdea,
                visualStyleKey: artStyle, storyMemory: finalMemory,
            }, existingDoc!.createdAt);
            toast.success("تم حفظ التعديلات بنجاح!");
            navigate(`/project/${mangaId}/editor`);
        } catch (e) { toast.error("فشل حفظ الإعدادات."); } finally { setIsGenerating(false); }
    }

    const StepIndicator = () => (
        <div className="flex justify-center items-center gap-4 md:gap-8 mb-8">
            {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                    <div className={ `w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= s ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{s}</div>
                    <span className={`font-semibold hidden sm:inline ${step >= s ? 'text-slate-100' : 'text-slate-500'}`}>
                        {s === 1 && 'الفكرة الأساسية'}
                        {s === 2 && 'بناء العالم'}
                        {s === 3 && 'التوليد'}
                    </span>
                </div>
            ))}
        </div>
    );
    
    if (isLoading) return <Loader text="...جاري تحميل بيانات المشروع" />;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
             <header className="text-center">
                <h1 className="text-4xl font-bold text-violet-400">{isEditing ? "تعديل مشروع مانغا" : "تكوين مانغا: مشروع جديد"}</h1>
                <p className="text-slate-400 mt-2">{isEditing ? "قم بتحديث تفاصيل مشروعك." : "رحلة إبداعية من ثلاث خطوات لإنشاء عالمك."}</p>
            </header>
            <StepIndicator />

            <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                    {step === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>الخطوة 1: الفكرة الأساسية</CardTitle>
                                <CardDescription>ابدأ بفكرة القصة، العنوان، والنمط الفني.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="title">عنوان المانغا</Label>
                                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مغامرات المستكشف الأخير" />
                                </div>
                                <div>
                                    <Label>النمط الفني</Label>
                                    <Select value={artStyle} onValueChange={(v) => setArtStyle(v as ArtStyle)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>{ART_STYLES_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="storyIdea">فكرة القصة الرئيسية (Logline)</Label>
                                    <Textarea id="storyIdea" value={storyIdea} onChange={e => setStoryIdea(e.target.value)} placeholder="اكتب هنا ملخص القصة في سطر أو سطرين..." rows={3} />
                                </div>
                            </CardContent>
                             <CardFooter className="justify-end">
                                <Button onClick={() => setStep(2)} disabled={!title.trim() || !storyIdea.trim()}>
                                    الخطوة التالية <ArrowLeft className="mr-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                    {step === 2 && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>الخطوة 2: بناء العالم بمساعدة الذكاء الاصطناعي</CardTitle>
                                    <CardDescription>هنا يتم وضع أساس ذاكرة القصة. يمكنك طلب المساعدة من الذكاء الاصطناعي أو الإضافة يدويًا.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button onClick={handleBrainstorm} isLoading={isGenerating} className="w-full" variant="secondary">
                                        <Wand2 className="ml-2 h-4 w-4" />
                                        🚀 ساعدني يا AI في بناء العالم
                                    </Button>
                                </CardContent>
                            </Card>
                           
                            {/* Characters */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>الشخصيات</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {characters.map((char, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                                            <Input value={char.name} onChange={(e) => { const newChars = [...characters]; newChars[index].name = e.target.value; setCharacters(newChars);}} placeholder="اسم الشخصية" className="flex-grow"/>
                                            <Button size="icon" variant="destructive" onClick={() => setCharacters(characters.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                     <Button size="sm" variant="outline" onClick={() => setCharacters([...characters, {name: '', role: '', description: '', traits: []}])}><PlusCircle className="ml-2 h-4 w-4" /> أضف شخصية</Button>
                                </CardContent>
                            </Card>
                            {/* Places & Themes */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader><CardTitle>الأماكن</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {places.map((place, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                                                <Input value={place.name} onChange={(e) => { const newPlaces = [...places]; newPlaces[index].name = e.target.value; setPlaces(newPlaces);}} placeholder="اسم المكان" className="flex-grow"/>
                                                <Button size="icon" variant="destructive" onClick={() => setPlaces(places.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="outline" onClick={() => setPlaces([...places, {name: '', description: ''}])}><PlusCircle className="ml-2 h-4 w-4" /> أضف مكانًا</Button>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader><CardTitle>المواضيع (Themes)</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex flex-wrap gap-2">
                                        {themes.map((theme, index) => (
                                            <Badge key={index} variant="secondary" className="flex items-center gap-2">
                                                {theme}
                                                <button onClick={() => setThemes(themes.filter((_, i) => i !== index))}><X className="h-3 w-3"/></button>
                                            </Badge>
                                        ))}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Input
                                                value={newTheme}
                                                onChange={e => setNewTheme(e.target.value)}
                                                placeholder="أضف موضوعًا..."
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault(); // Prevents form submission if any
                                                        handleAddTheme();
                                                    }
                                                }}
                                            />
                                            <Button size="sm" onClick={handleAddTheme}>إضافة</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <Button onClick={() => setStep(1)} variant="outline"><ArrowRight className="ml-2 h-4 w-4" /> رجوع</Button>
                                <Button onClick={() => setStep(3)}>الخطوة التالية <ArrowLeft className="mr-2 h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                       <Card>
                            <CardHeader className="text-center">
                                <CardTitle>الخطوة 3: جاهز للإنطلاق!</CardTitle>
                                <CardDescription>{isEditing ? "سيتم حفظ التغييرات على مشروعك." : "سيقوم الذكاء الاصطناعي الآن بتوليد مخطط للصفحة الأولى بناءً على إعداداتك."}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-slate-800/50 rounded-lg text-sm space-y-2">
                                    <p><strong className="text-violet-400">العنوان:</strong> {title}</p>
                                    <p><strong className="text-violet-400">الشخصيات:</strong> {characters.map(c => c.name).join(', ') || 'لا يوجد'}</p>
                                    <p><strong className="text-violet-400">الأماكن:</strong> {places.map(p => p.name).join(', ') || 'لا يوجد'}</p>
                                    <p><strong className="text-violet-400">المواضيع:</strong> {themes.join(', ') || 'لا يوجد'}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col sm:flex-row justify-between gap-4">
                                 <Button onClick={() => setStep(2)} variant="outline"><ArrowRight className="ml-2 h-4 w-4" /> رجوع</Button>
                                 {isEditing ? (
                                    <Button onClick={handleSaveSettings} isLoading={isGenerating} size="lg">
                                        <Save className="ml-2 h-4 w-4" />
                                        حفظ التعديلات
                                    </Button>
                                ) : (
                                    <Button onClick={handleGenerateProject} isLoading={isGenerating} size="lg">
                                        <BookImage className="ml-2 h-4 w-4" />
                                        أنشئ المشروع وولّد الصفحة الأولى
                                    </Button>
                                )}
                            </CardFooter>
                       </Card>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SetupPage;
