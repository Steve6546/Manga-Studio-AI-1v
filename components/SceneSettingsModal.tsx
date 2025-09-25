import React, { useState, useEffect } from 'react';
// FIX: Corrected import path
import { SceneSettings, VisualStyleKey, ArtStyle, OptionType } from '../types';
import { 
  ART_STYLES_OPTIONS, 
  CAMERA_ANGLE_OPTIONS, 
  DETAIL_LEVEL_OPTIONS, 
  COLOR_TONE_OPTIONS,
  DEFAULT_SCENE_SETTINGS
// FIX: Corrected import path
} from '../constants';
import Button from './Button';
import SelectInput from './SelectInput';
import TextAreaInput from './TextAreaInput'; 

interface SceneSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: SceneSettings, styleKey: VisualStyleKey) => void;
  initialSettings?: SceneSettings;
  initialStyleKey: VisualStyleKey;
  sceneText: string;
  isGenerating: boolean;
}

const SceneSettingsModal: React.FC<SceneSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings,
  initialStyleKey,
  sceneText,
  isGenerating,
}) => {
  const [styleKey, setStyleKey] = useState<VisualStyleKey>(initialStyleKey);
  const [cameraAngle, setCameraAngle] = useState<string>(DEFAULT_SCENE_SETTINGS.cameraAngle);
  const [detailLevel, setDetailLevel] = useState<number>(DEFAULT_SCENE_SETTINGS.detailLevel);
  const [colorTone, setColorTone] = useState<SceneSettings['colorTone']>(DEFAULT_SCENE_SETTINGS.colorTone);
  const [additionalDetails, setAdditionalDetails] = useState<string>('');

  useEffect(() => {
    setStyleKey(initialStyleKey);
    setCameraAngle(initialSettings?.cameraAngle || DEFAULT_SCENE_SETTINGS.cameraAngle);
    setDetailLevel(initialSettings?.detailLevel || DEFAULT_SCENE_SETTINGS.detailLevel);
    setColorTone(initialSettings?.colorTone || DEFAULT_SCENE_SETTINGS.colorTone);
    setAdditionalDetails(initialSettings?.additionalDetails || '');
  }, [isOpen, initialSettings, initialStyleKey]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    const settings: SceneSettings = {
      cameraAngle,
      detailLevel,
      colorTone,
      additionalDetails: additionalDetails.trim(),
    };
    onSave(settings, styleKey);
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-gray-700">
        <h2 className="text-2xl font-bold text-sky-400 mb-6">تخصيص إعدادات المشهد</h2>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-1">نص المشهد (للمرجع):</h4>
          <p className="text-gray-300 bg-gray-700/50 p-3 rounded text-sm max-h-28 overflow-y-auto scrollbar-thin">
            {sceneText}
          </p>
        </div>

        <div className="space-y-4">
          <SelectInput
            label="النمط البصري"
            id="sceneStyleKey"
            options={ART_STYLES_OPTIONS}
            value={styleKey}
            onChange={(e) => setStyleKey(e.target.value as VisualStyleKey)}
            disabled={isGenerating}
          />
          <SelectInput
            label="زاوية الكاميرا"
            id="cameraAngle"
            options={CAMERA_ANGLE_OPTIONS}
            value={cameraAngle}
            onChange={(e) => setCameraAngle(e.target.value)}
            disabled={isGenerating}
          />
          <SelectInput
            label="مستوى التفاصيل"
            id="detailLevel"
            options={DETAIL_LEVEL_OPTIONS.map(opt => ({...opt, value: opt.value.toString()}))} // SelectInput expects string values
            value={detailLevel.toString()}
            onChange={(e) => setDetailLevel(parseInt(e.target.value, 10))}
            disabled={isGenerating}
          />
          <SelectInput
            label="طابع الألوان"
            id="colorTone"
            options={COLOR_TONE_OPTIONS}
            value={colorTone}
            onChange={(e) => setColorTone(e.target.value as SceneSettings['colorTone'])}
            disabled={isGenerating}
          />
          <TextAreaInput // Assuming TextAreaInput is similar to TextInput but for multi-line
            label="تفاصيل إضافية (اختياري)"
            id="additionalDetails"
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="مثال: إضاءة ليلية، أجواء غامضة، الخ."
            rows={3}
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
            disabled={isGenerating}
          />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
          <Button onClick={onClose} variant="secondary" disabled={isGenerating}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} variant="primary" isLoading={isGenerating} disabled={isGenerating}>
            {isGenerating ? 'جاري التوليد...' : 'حفظ وتوليد الصورة'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SceneSettingsModal;
