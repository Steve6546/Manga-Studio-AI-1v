import React, { useState, useEffect } from 'react';
// FIX: Corrected import path
import { WorldEvent } from '../types';
import Button from './Button';
import TextAreaInput from './TextAreaInput';

interface WorldEventFormProps {
  eventItem?: WorldEvent; // Changed prop name from event to eventItem to avoid keyword clash
  onSave: (eventItem: WorldEvent) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const WorldEventForm: React.FC<WorldEventFormProps> = ({ eventItem, onSave, onCancel, isLoading }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (eventItem) {
      setDescription(eventItem.description || '');
    } else {
      setDescription('');
    }
  }, [eventItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: eventItem?.id || Date.now().toString(),
      description: description.trim(),
      // sceneOrder can be handled separately if needed
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-700 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-sky-300 mb-3">
        {eventItem ? 'تعديل حدث رئيسي' : 'إضافة حدث رئيسي جديد'}
      </h3>
      <TextAreaInput
        label="وصف الحدث"
        id="eventDescription"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        required
        disabled={isLoading}
        placeholder="وصف موجز للحدث الرئيسي وتأثيره على القصة."
      />
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" onClick={onCancel} variant="secondary" disabled={isLoading}>
          إلغاء
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || !description.trim()}>
          {isLoading ? 'جاري الحفظ...' : 'حفظ الحدث'}
        </Button>
      </div>
    </form>
  );
};

export default WorldEventForm;
