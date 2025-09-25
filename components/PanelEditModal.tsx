import React, { useState, useEffect } from 'react';
// FIX: Import useParams from react-router-dom to resolve 'Cannot find name 'useParams'' error.
import { useParams } from 'react-router-dom';
import { Panel, SceneSettings, VisualStyleKey } from '../types';
import { useMangaStore } from '../src/state/mangaStore';
import { googleAIController } from '../services/aiController';
import { AIPromptInputs, AIOutputTypes } from '../types';
import { Button } from './ui/Button';
import Modal from './ui/Modal';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { ART_STYLES_OPTIONS, CAMERA_ANGLE_OPTIONS, DETAIL_LEVEL_OPTIONS, COLOR_TONE_OPTIONS, DEFAULT_SCENE_SETTINGS } from '../constants';
import toast from 'react-hot-toast';

interface PanelEditModalProps {
  panel: Panel;
  isOpen: boolean;
  onClose: () => void;
}

const PanelEditModal: React.FC<PanelEditModalProps> = ({ panel, isOpen, onClose }) => {
  const { currentMangaDocument, updatePanel } = useMangaStore();
  const { chapterNumber, pageNumber } = useParams<{ chapterNumber: string; pageNumber: string; }>();

  const [description, setDescription] = useState(panel.description);
  const [settings, setSettings] = useState<SceneSettings>(panel.settings || DEFAULT_SCENE_SETTINGS);
  const [styleKey, setStyleKey] = useState<VisualStyleKey>(panel.styleKey);
  
  const [isRegeneratingText, setIsRegeneratingText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
        setDescription(panel.description);
        setSettings(panel.settings || DEFAULT_SCENE_SETTINGS);
        setStyleKey(panel.styleKey);
    }
  }, [panel, isOpen]);

  const numChapter = parseInt(chapterNumber!, 10);
  const numPage = parseInt(pageNumber!, 10);
  
  const handleRegenerateElements = async () => {
    if (!currentMangaDocument) return;
    setIsRegeneratingText(true);
    const toastId = toast.loading("جاري إعادة توليد النصوص...");
    try {
        const panelElementsInput: AIPromptInputs["generate_panel_elements"] = {
            panelDescription: description,
            storyMemory: currentMangaDocument.storyMemory,
            panelOrder: panel.panelOrder,
        };
        const elements = await googleAIController("generate_panel_elements", panelElementsInput) as AIOutputTypes["generate_panel_elements"];
        const updatedPanel = { ...panel, description, caption: elements.caption, dialogue: elements.dialogue };
        await updatePanel(numChapter, numPage, updatedPanel, true);
        toast.success("تم تحديث نصوص اللوحة بنجاح!", { id: toastId });
        onClose();
    } catch (e: any) {
        toast.error(`فشل تحديث النصوص: ${e.message}`, { id: toastId });
    } finally {
        setIsRegeneratingText(false);
    }
  };
  
  const handleSave = async () => {
      setIsSaving(true);
      try {
          await updatePanel(numChapter, numPage, { ...panel, description, settings, styleKey }, true);
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
            <Textarea id="panel-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
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
            <Button onClick={handleSave} variant="outline" isLoading={isSaving} disabled={isRegeneratingText}>حفظ الإعدادات</Button>
            <Button onClick={handleRegenerateElements} isLoading={isRegeneratingText} disabled={isSaving}>إعادة توليد الحوار/التعليق</Button>
        </div>
      </div>
    </Modal>
  );
};

export default PanelEditModal;