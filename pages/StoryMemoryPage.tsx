import React, { useState } from 'react';
import { useMangaStore } from '../src/state/mangaStore';
import { googleAIController } from '../services/aiController';
import { 
  StoryMemory, CharacterMemory, WorldPlace, WorldEvent, AIPromptInputs, SuggestedMemoryUpdates, AIOutputTypes
} from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import CharacterForm from '../components/CharacterForm';
import WorldPlaceForm from '../components/WorldPlaceForm';
import WorldEventForm from '../components/WorldEventForm';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { BrainCircuit, Bot, User, Map, Calendar, Trash2, Edit } from 'lucide-react';

const StoryMemoryPage: React.FC = () => {
  const {
      currentMangaDocument: project,
      updateAndSaveMangaDocument,
  } = useMangaStore();

  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterMemory | undefined>(undefined);
  // ... similar states for Place and Event forms

  const [isAnalyzingMemory, setIsAnalyzingMemory] = useState(false);
  const [memorySuggestions, setMemorySuggestions] = useState<SuggestedMemoryUpdates | null>(null);

  const handleSaveStoryMemory = async (updatedMemory: StoryMemory) => {
    if (!project) return;
    await updateAndSaveMangaDocument({ storyMemory: updatedMemory });
  };
  
  const handleDebouncedSave = (updatedMemory: Partial<StoryMemory>) => {
    if (!project) return;
    // Debouncing can be added if needed, for now direct save on blur
    handleSaveStoryMemory({ ...project.storyMemory, ...updatedMemory });
  };

  // --- CRUD Handlers ---
  const handleSaveCharacter = (char: CharacterMemory) => {
    if (!project?.storyMemory) return;
    const updatedChars = [...project.storyMemory.characters];
    const index = updatedChars.findIndex(c => c.id === char.id);
    if (index > -1) updatedChars[index] = char;
    else updatedChars.push(char);
    handleSaveStoryMemory({ ...project.storyMemory, characters: updatedChars });
    setShowCharacterForm(false);
    setEditingCharacter(undefined);
  };
  const handleDeleteCharacter = (charId: string) => {
    if (!project?.storyMemory || !window.confirm("هل أنت متأكد؟")) return;
    const updatedChars = project.storyMemory.characters.filter(c => c.id !== charId);
    handleSaveStoryMemory({ ...project.storyMemory, characters: updatedChars });
  };
  
  const handleAnalyzeStoryMemory = async () => {
    if (!project?.content) {
        toast.error("لا يوجد نص سردي لتحليله. يرجى كتابة بعض المحتوى في محرر النص أولاً.");
        return;
    }
    setIsAnalyzingMemory(true);
    const toastId = toast.loading("جاري تحليل النص...");
    try {
        const input: AIPromptInputs["analyze_and_suggest_memory_updates"] = {
            currentStoryContent: project.content,
            existingStoryMemory: project.storyMemory,
        };
        const suggestions = await googleAIController("analyze_and_suggest_memory_updates", input) as AIOutputTypes["analyze_and_suggest_memory_updates"];
        setMemorySuggestions(suggestions);
        toast.success("تم العثور على اقتراحات!", { id: toastId });
    } catch(e: any) {
        toast.error(`فشل التحليل: ${e.message}`, { id: toastId });
    } finally {
        setIsAnalyzingMemory(false);
    }
  };

  if (!project || !project.storyMemory) return <div className="text-center p-8">جاري تحميل ذاكرة القصة...</div>;

  const { storyMemory } = project;

  return (
    <div className="h-full flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-violet-400 flex items-center gap-2"><BrainCircuit /> ذاكرة القصة</h1>
        <p className="text-slate-400">إدارة عناصر القصة الأساسية لضمان الاتساق والتطور المنطقي.</p>
      </header>
      
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
                <CardTitle>الذاكرة العامة</CardTitle>
                <Button onClick={handleAnalyzeStoryMemory} isLoading={isAnalyzingMemory} size="sm" className="absolute top-4 left-4">
                    <Bot className="ml-2 h-4 w-4" /> تحليل النص
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="storyTheme">الموضوع الرئيسي / الثيم</Label>
                    <Input id="storyTheme" defaultValue={storyMemory.theme || ''} onBlur={e => handleDebouncedSave({ theme: e.target.value })} placeholder="مثال: الصداقة، الخلاص" />
                </div>
                 <div>
                    <Label htmlFor="storyStyleNotes">ملاحظات الأسلوب العام</Label>
                    <Textarea id="storyStyleNotes" defaultValue={storyMemory.overallStyleNotes || ''} onBlur={e => handleDebouncedSave({ overallStyleNotes: e.target.value })} rows={3} placeholder="مثال: قصة مغامرات فكاهية" />
                </div>
            </CardContent>
        </Card>

        {/* Characters Section */}
        <Card className="bg-slate-900/70 border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> الشخصيات</CardTitle>
                <Button onClick={() => { setEditingCharacter(undefined); setShowCharacterForm(true); }} size="sm" className="absolute top-4 left-4">إضافة شخصية</Button>
            </CardHeader>
            <CardContent>
                 {showCharacterForm && <CharacterForm character={editingCharacter} onSave={handleSaveCharacter} onCancel={() => setShowCharacterForm(false)} />}
                <div className="mt-4 space-y-3">
                {storyMemory.characters.map(char => (
                    <div key={char.id} className="bg-slate-800/50 p-3 rounded-md flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-violet-300">{char.name}</h4>
                            <p className="text-sm text-slate-400">{char.role || 'دور غير محدد'}</p>
                        </div>
                        <div className="space-x-2 space-x-reverse">
                            <Button onClick={() => { setEditingCharacter(char); setShowCharacterForm(true);}} variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                            <Button onClick={() => handleDeleteCharacter(char.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>
        {/* ... Other sections for World Places and Events would follow a similar pattern ... */}
      </div>
    </div>
  );
};

export default StoryMemoryPage;
