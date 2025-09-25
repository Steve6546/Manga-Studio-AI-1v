
import React, { useState, useEffect } from 'react';
import { WorldPlace } from '../types';
import Button from './Button';
import TextInput from './TextInput';
import TextAreaInput from './TextAreaInput';

interface WorldPlaceFormProps {
  place?: WorldPlace;
  onSave: (place: WorldPlace) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const WorldPlaceForm: React.FC<WorldPlaceFormProps> = ({ place, onSave, onCancel, isLoading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (place) {
      setName(place.name || '');
      setDescription(place.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [place]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: place?.id || Date.now().toString(),
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-700 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-sky-300 mb-3">
        {place ? 'تعديل مكان' : 'إضافة مكان جديد'}
      </h3>
      <TextInput
        label="اسم المكان"
        id="placeName"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isLoading}
        placeholder="مثال: القلعة المظلمة"
      />
      <TextAreaInput
        label="وصف المكان (اختياري)"
        id="placeDescription"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        disabled={isLoading}
        placeholder="وصف موجز للمكان وأهميته."
      />
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" onClick={onCancel} variant="secondary" disabled={isLoading}>
          إلغاء
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !name.trim()}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ المكان'}
        </Button>
      </div>
    </form>
  );
};

export default WorldPlaceForm;