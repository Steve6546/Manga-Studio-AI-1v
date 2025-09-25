

import React from 'react';
// FIX: Removed Scene from import as it's not exported from types. Panel is kept if directly used, otherwise TimelineItem is self-sufficient.
import { Panel } from '../types'; 
import { visualStyles } from '../src/engine/visualStyles'; 

// The 'Scene' type here is a simplified representation for the timeline item.
// It could come from a Panel or an older Scene object.
interface TimelineItem {
  text: string;
  imageUrl?: string;
  timestamp: number;
  order: number; // panelOrder or sceneOrder
  styleKey: string; // ArtStyle key
}

interface TimelineProps {
  scenes: TimelineItem[]; // Now accepts more generic items
  storyTitle?: string;
}

const Timeline: React.FC<TimelineProps> = ({ scenes, storyTitle = "عنصر" }) => {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-800 rounded-lg shadow">
        <p className="text-xl">🎬</p>
        <p>لا توجد عناصر لعرضها في الخط الزمني حتى الآن.</p>
        <p className="text-sm">قد تحتاج لتوليد لوحات أو مشاهد أولاً.</p>
      </div>
    );
  }

  // Ensure items are sorted by order
  const sortedItems = [...scenes].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-sky-400 mb-4">الخط الزمني للعناصر:</h3>
      <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-thin scrollbar-thumb-sky-600 scrollbar-track-gray-700">
        {sortedItems.map((item, index) => (
          <div 
            key={item.order ?? index} 
            className="min-w-[250px] max-w-[250px] sm:min-w-[300px] sm:max-w-[300px] bg-gray-700 p-3 rounded-lg shadow-md flex flex-col"
            aria-label={`عنصر رقم ${item.order + 1}`}
          >
            <h4 className="text-sm font-semibold text-sky-300 mb-2 truncate">
              {storyTitle} #{item.order + 1}
            </h4>
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={`${storyTitle} - عنصر ${item.order + 1} - ${item.styleKey ? visualStyles[item.styleKey as keyof typeof visualStyles] : ''}`}
                className="w-full h-40 sm:h-48 object-cover rounded-md mb-2 shadow" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-40 sm:h-48 bg-gray-600 rounded-md mb-2 flex items-center justify-center text-gray-400 text-sm shadow">
                لا توجد صورة
              </div>
            )}
            <div className="h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-600 text-right">
              <p className="text-xs text-gray-300 whitespace-pre-wrap">
                {item.text.length > 150 ? item.text.slice(0, 147) + "..." : item.text}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-auto pt-1 text-left">
              {item.timestamp ? new Date(item.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;