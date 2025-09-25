
import React, { useState, useEffect } from 'react';
import { CharacterMemory } from '../types';
import Button from './Button';
import TextInput from './TextInput';
import TextAreaInput from './TextAreaInput'; // Assuming this component exists

interface CharacterFormProps {
  character?: CharacterMemory; // For editing existing character
  onSave: (character: CharacterMemory) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CharacterForm: React.FC<CharacterFormProps> = ({ character, onSave, onCancel, isLoading }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [traits, setTraits] = useState(''); // Comma-separated string
  const [description, setDescription] = useState('');
  const [history, setHistory] = useState(''); // Could be a list of strings, joined by newline for textarea

  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setRole(character.role || '');
      setTraits(character.traits?.join(', ') || '');
      setDescription(character.description || '');
      setHistory(character.history?.join('\n') || '');
    } else {
      // Reset for new character
      setName('');
      setRole('');
      setTraits('');
      setDescription('');
      setHistory('');
    }
  }, [character]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const traitsArray = traits.split(',').map(t => t.trim()).filter(t => t);
    const historyArray = history.split('\n').map(h => h.trim()).filter(h => h);
    
    onSave({
      id: character?.id || Date.now().toString(), // Keep existing ID or generate new
      name: name.trim(),
      role: role.trim() || undefined,
      traits: traitsArray.length > 0 ? traitsArray : undefined,
      description: description.trim() || undefined,
      history: historyArray.length > 0 ? historyArray : undefined,
      relationships: character?.relationships || [], // Preserve existing relationships
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-700 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-sky-300 mb-3">
        {character ? 'تعديل شخصية' : 'إضافة شخصية جديدة'}
      </h3>
      <TextInput
        label="اسم الشخصية"
        id="charName"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isLoading}
        placeholder="مثال: البطل أحمد"
      />
      <TextInput
        label="الدور (اختياري)"
        id="charRole"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={isLoading}
        placeholder="مثال: بطل، خصم، مساعد"
      />
      <TextInput
        label="السمات (مفصولة بفاصلة)"
        id="charTraits"
        value={traits}
        onChange={(e) => setTraits(e.target.value)}
        disabled={isLoading}
        placeholder="مثال: شجاع, ذكي, غامض"
      />
      <TextAreaInput
        label="الوصف/الخلفية (اختياري)"
        id="charDescription"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        disabled={isLoading}
        placeholder="وصف موجز للشخصية، مظهرها، أو خلفيتها."
      />
       <TextAreaInput
        label="تاريخ الشخصية (أحداث مرت بها، كل حدث في سطر)"
        id="charHistory"
        value={history}
        onChange={(e) => setHistory(e.target.value)}
        rows={3}
        disabled={isLoading}
        placeholder="أحداث مهمة مرت بها الشخصية تؤثر في تكوينها."
      />
      {/* Relationship editing can be added here later if needed */}
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" onClick={onCancel} variant="secondary" disabled={isLoading}>
          إلغاء
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !name.trim()}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ الشخصية'}
        </Button>
      </div>
    </form>
  );
};

export default CharacterForm;