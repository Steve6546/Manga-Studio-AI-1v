import React, { useState, useEffect } from 'react';
// FIX: Import useParams from react-router-dom to resolve 'Cannot find name 'useParams'' error.
import { useParams } from 'react-router-dom';
// FIX: Corrected import path
import { Panel, SceneSettings, VisualStyleKey, SpeechBubble } from '../types';
import { useMangaStore } from '../src/state/mangaStore';
// FIX: Corrected import path
import { googleAIController } from '../services/aiController';
// FIX: Corrected import path
import { AIPromptInputs, AIOutputTypes } from '../types';
import { Button } from './ui/Button';
import Modal from './ui/Modal';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
// FIX: Corrected import path
import { ART_STYLES_OPTIONS, CAMERA_ANGLE_OPTIONS, DETAIL_LEVEL_OPTIONS, COLOR_TONE_OPTIONS, DEFAULT_SCENE_SETTINGS } from '../constants';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

interface PanelEditModalProps {
  panel: Panel;
  isOpen: boolean;
  onClose: () => void;
}

const PanelEditModal: React.FC<PanelEditModalProps> = ({ panel, isOpen, onClose }) => {
  const { currentMangaDocument, updatePanel } = useMangaStore();
  const { chapterNumber, pageNumber } = useParams<{ chapterNumber: string; pageNumber: string; }>();

  // Panel content state
  const [description, setDescription] = useState(panel.description);
  const [caption, setCaption] = useState(panel.caption || '');
  const [dialogue, setDialogue] = useState<SpeechBubble[]>(panel.dialogue || []);

  // Panel settings state
  const [settings, setSettings] = useState<SceneSettings>(panel.settings || DEFAULT_SCENE_SETTINGS);
  const [styleKey, setStyleKey] = useState<VisualStyleKey>(panel.styleKey);
  
  // UI state
  const [isRegeneratingText, setIsRegeneratingText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
        setDescription(panel.description);
        setSettings(panel.settings || DEFAULT_SCENE_SETTINGS);
        setStyleKey(panel.styleKey);
        setCaption(panel.caption || '');
        setDialogue(panel.dialogue || []);
    }
  }, [panel, isOpen]);

  const numChapter = parseInt(chapterNumber!, 10);
  const numPage = parseInt(pageNumber!, 10);
  
  const handleRegenerateElements = async () => {
    if (!currentMangaDocument) return;
    setIsRegeneratingText(true);
    const toastId = toast.loading("جاري توليد النصوص...");
    try {
        const panelElementsInput: AIPromptInputs["generate_panel_elements"] = {
            panelDescription: description,
            storyMemory: currentMangaDocument.storyMemory,
            panelOrder: panel.panelOrder,
        };
        const elements = await googleAIController("generate_panel_elements", panelElementsInput) as AIOutputTypes["generate_panel_elements"];
        
        // Update local state instead of saving
        setCaption(elements.caption || '');
        setDialogue(elements.dialogue || []);

        toast.success("تم توليد نصوص جديدة! راجعها ثم احفظ.", { id: toastId });

    } catch (e: any) {
        toast.error(`فشل تحديث النصوص: ${e.message}`, { id: toastId });
    } finally {
        setIsRegeneratingText(false);
    }
  };
  
  const handleSave = async () => {
      setIsSaving(true);
      try {
          const updatedPanelData = { ...panel, description, settings, styleKey, caption, dialogue };
          await updatePanel(numChapter, numPage, updatedPanelData, true);
          toast.success("تم حفظ التعديلات بنجاح.");
          onClose();
      } catch (e) {
          toast.error("فشل حفظ التعديلات.");
      } finally {
          setIsSaving(false);
      }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل لوحة #${panel.panelOrder + 1}`}>
      <div className="space-y-4 text-sm">
        <div>
            <Label htmlFor="panel-desc">وصف اللوحة</Label>
            <Textarea id="panel-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        </div>
        
        <h4 className="text-base font-semibold text-violet-300 pt-2 border-t border-slate-700">النصوص المولّدة</h4>
        <div>
            <Label htmlFor="panel-caption">التعليق (Caption)</Label>
            <Textarea id="panel-caption" value={caption} onChange={e => setCaption(e.target.value)} rows={1} placeholder="..."/>
        </div>
        <div>
            <Label>الحوار (Dialogue)</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 bg-slate-950/50 p-2 rounded-md">
                {dialogue.map((bubble, index) => (
                    <div key={index} className="flex gap-2 items-center p-1 bg-slate-800/50 rounded-md">
                        <Input 
                            value={bubble.characterName} 
                            onChange={(e) => {
                                const newDialogue = [...dialogue];
                                newDialogue[index].characterName = e.target.value;
                                setDialogue(newDialogue);
                            }}
                            placeholder="الشخصية"
                            className="w-1/3 h-8"
                        />
                        <Input 
                            value={bubble.text} 
                            onChange={(e) => {
                                const newDialogue = [...dialogue];
                                newDialogue[index].text = e.target.value;
                                setDialogue(newDialogue);
                            }}
                            placeholder="نص الحوار"
                            className="flex-grow h-8"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => {
                            setDialogue(dialogue.filter((_, i) => i !== index));
                        }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 {dialogue.length === 0 && <p className="text-xs text-center text-slate-500 py-2">لا يوجد حوار.</p>}
            </div>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                setDialogue([...dialogue, { characterName: '', style: 'normal', text: '' }]);
            }}>
                <PlusCircle className="mr-2 h-4 w-4" /> إضافة حوار
            </Button>
        </div>

        <h4 className="text-base font-semibold text-violet-300 pt-2 border-t border-slate-700">إعدادات توليد الصورة</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label>النمط الفني</Label>
                <Select value={styleKey} onValueChange={(v) => setStyleKey(v as VisualStyleKey)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{ART_STYLES_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div>
                <Label>زاوية الكاميرا</Label>
                <Select value={settings.cameraAngle} onValueChange={(v) => setSettings(s => ({...s, cameraAngle: v}))}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                     <SelectContent>{CAMERA_ANGLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div>
                <Label>مستوى التفاصيل</Label>
                <Select value={String(settings.detailLevel)} onValueChange={(v) => setSettings(s => ({...s, detailLevel: parseInt(v, 10)}))}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{DETAIL_LEVEL_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div>
                <Label>طابع الألوان</Label>
                <Select value={settings.colorTone} onValueChange={(v) => setSettings(s => ({...s, colorTone: v as any}))}>
                     <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{COLOR_TONE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label htmlFor="panel-additional">تفاصيل إضافية</Label>
            <Textarea id="panel-additional" value={settings.additionalDetails || ''} onChange={e => setSettings(s => ({...s, additionalDetails: e.target.value}))} rows={2} />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
            <Button onClick={onClose} variant="secondary" disabled={isRegeneratingText || isSaving}>إلغاء</Button>
            <Button onClick={handleRegenerateElements} variant="outline" isLoading={isRegeneratingText} disabled={isSaving}>إعادة توليد الحوار/التعليق</Button>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isRegeneratingText}>حفظ التغييرات</Button>
        </div>
      </div>
    </Modal>
  );
};

export default PanelEditModal;