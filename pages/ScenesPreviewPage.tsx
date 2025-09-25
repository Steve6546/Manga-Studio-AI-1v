
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

// This page is largely superseded by MangaPageViewer.tsx for the manga flow.
// It's kept temporarily to avoid breaking existing routes but needs to be
// re-evaluated or removed in a future sprint.

const ScenesPreviewPage: React.FC = () => {
  const { mangaId } = useParams<{ mangaId: string }>(); // Use mangaId directly
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-center">
      <h1 className="text-2xl font-bold text-sky-400">معاينة المشاهد (نمط قديم)</h1>
      <p className="text-gray-400">
        هذه الصفحة كانت تستخدم لعرض المشاهد النصية وتوليد صور لها.
        في نظام المانغا الجديد، يتم عرض وتحرير الصفحات واللوحات (البانلز) بشكل مختلف.
      </p>
      <p className="text-yellow-400">
        إذا كنت تعمل على مشروع مانغا، يرجى استخدام عارض صفحات المانغا بدلاً من هذه الصفحة.
      </p>
      <div className="mt-6 space-y-2">
        <Button 
            onClick={() => {
                // Attempt to navigate to the first page of the first chapter if it's a manga project
                // This is a guess; a more robust navigation would fetch the MangaDocument first
                // Assuming default chapter 1, page 1 for simplicity if direct navigation is needed
                navigate(`/manga/${mangaId}/chapter/1/page/1`);
            }} 
            variant="primary"
            disabled={!mangaId} // Disable if no mangaId
        >
            الانتقال إلى عارض صفحات المانغا
        </Button>
        <Button onClick={() => navigate(`/story/${mangaId}`)} variant="secondary" disabled={!mangaId}>
          عرض تفاصيل المشروع
        </Button>
        <Button onClick={() => navigate('/dashboard')} variant="secondary">
          العودة إلى لوحة التحكم
        </Button>
      </div>
    </div>
  );
};

export default ScenesPreviewPage;
