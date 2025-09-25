
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMangaStore } from '../src/state/mangaStore';
import { StoryFeedback, Panel, AIPromptInputs, AIOutputTypes } from '../types';
import Timeline from '../components/Timeline';
import Button from '../components/Button';
import SimpleModal from '../components/SimpleModal'; 
import { googleAIController } from '../services/aiController'; 
import { ART_STYLES_OPTIONS, ENVIRONMENT_OPTIONS, APP_TITLE } from '../constants';

const StoryViewPage: React.FC = () => {
  const { mangaId } = useParams<{ mangaId: string }>();
  const navigate = useNavigate();

  const {
      currentMangaDocument: project,
      isLoading,
      error,
      loadMangaDocument,
  } = useMangaStore();

  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [storyFeedback, setStoryFeedback] = useState<StoryFeedback | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (mangaId && mangaId !== project?.id) {
        loadMangaDocument(mangaId);
    } else if (!mangaId) {
        navigate('/dashboard');
    }
  }, [mangaId, project?.id, loadMangaDocument, navigate]);

  useEffect(() => {
      if (project?.title) {
        document.title = `عرض: ${project.title} - ${APP_TITLE}`;
      }
      return () => { document.title = APP_TITLE; };
  }, [project?.title]);

  const getLabel = (value: string, options: {value: string, label: string}[]) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  const handleGetStoryFeedback = async () => {
    if (!project) return;
    setIsFetchingFeedback(true);
    setStoryFeedback(null);
    setFeedbackError(null);
    try {
      const input: AIPromptInputs["get_story_feedback"] = {
        storyTitle: project.title,
        storySummary: project.summary,
        storyContent: project.content, 
        storyMemory: project.storyMemory, 
      };
      const feedback = await googleAIController("get_story_feedback", input) as AIOutputTypes["get_story_feedback"];
      setStoryFeedback(feedback);
    } catch (e: any) {
      console.error("Failed to get story feedback:", e);
      setFeedbackError(`فشل الحصول على المراجعة: ${e.message || "خطأ غير معروف"}`);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const getAllPanelsForTimeline = (): Panel[] => {
    if (!project || !project.chapters) return [];
    return project.chapters.flatMap(chapter => chapter.pages.flatMap(page => page.panels));
  };


  if (isLoading && !project) {
    return <div className="flex justify-center items-center h-60"><svg className="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p className="ml-2 text-gray-400">جاري تحميل المشروع...</p></div>;
  }

  if (error && !project) {
    return (
      <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-md">
        <p>{error}</p>
        <Button onClick={() => navigate('/dashboard')} variant="secondary" className="mt-4">
          العودة إلى لوحة التحكم
        </Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>لم يتم العثور على بيانات المشروع.</p>
         <Button onClick={() => navigate('/dashboard')} variant="secondary" className="mt-4">
          العودة إلى لوحة التحكم
        </Button>
      </div>
    );
  }
  
  const firstChapterNumber = project.chapters?.[0]?.chapterNumber || 1;
  const firstPageNumber = project.chapters?.[0]?.pages?.[0]?.pageNumber || 1;
  const canViewFirstPage = !!(project.chapters?.[0]?.pages?.[0]);

  return (
    <>
      <SimpleModal
          isOpen={!!storyFeedback || !!feedbackError}
          onClose={() => { setStoryFeedback(null); setFeedbackError(null); }}
          title={feedbackError ? "⚠️ خطأ" : "📊 مراجعة القصة من الذكاء الاصطناعي"}
        >
          {feedbackError ? <p className="text-red-400">{feedbackError}</p> : 
           storyFeedback && <div className="space-y-3 text-sm text-gray-300 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h4 className="font-semibold text-sky-300">التقييم العام:</h4>
                <p className="whitespace-pre-wrap">{storyFeedback.overallAssessment}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sky-300">نقاط القوة:</h4>
                <ul className="list-disc list-inside space-y-1">{storyFeedback.positivePoints.map((point, i) => <li key={`pos-${i}`}>{point}</li>)}</ul>
              </div>
              <div>
                <h4 className="font-semibold text-sky-300">جوانب للتحسين:</h4>
                <ul className="list-disc list-inside space-y-1">{storyFeedback.areasForImprovement.map((area, i) => <li key={`imp-${i}`}>{area}</li>)}</ul>
              </div>
            </div>
          }
      </SimpleModal>

      <div className="space-y-8">
        <header className="pb-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                  <h1 className="text-4xl font-bold text-sky-400 mb-2">{project.title}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                      <span>النمط الفني: {getLabel(project.artStyle, ART_STYLES_OPTIONS)}</span>
                      <span>البيئة العامة: {getLabel(project.environment, ENVIRONMENT_OPTIONS)}</span>
                  </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 flex-wrap">
                   <Button onClick={() => navigate(`/story/${mangaId}/memory`)} variant="secondary" className="bg-purple-600 hover:bg-purple-700">🧠 ذاكرة القصة</Button>
                    {canViewFirstPage &&
                      <Button onClick={() => navigate(`/manga/${mangaId}/chapter/${firstChapterNumber}/page/${firstPageNumber}`)} variant="primary">📖 عرض أول صفحة</Button>
                    }
                  <Button onClick={() => navigate(`/editor/${mangaId}`)} variant="secondary">✏️ تحرير النص</Button>
                   <Button onClick={handleGetStoryFeedback} isLoading={isFetchingFeedback} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700">📊 طلب مراجعة AI</Button>
              </div>
          </div>
        </header>

        {project.summary && (
          <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-sky-300 mb-3">الملخص العام:</h2>
            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{project.summary}</p>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold text-sky-300 mb-3">الخط الزمني للوحات المكتملة:</h2>
          <Timeline scenes={getAllPanelsForTimeline().filter(p => p.imageUrl).map(p => ({ 
                text: p.description, imageUrl: p.imageUrl,
                timestamp: p.timestamp || 0, order: p.panelOrder,
                styleKey: p.styleKey,
          }))} storyTitle={project.title} />
        </section>

        {project.content && (
          <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-sky-300 mb-3">النص السردي الكامل:</h2>
            <div className="text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto p-3 bg-gray-700/50 rounded scrollbar-thin">
              {project.content}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default StoryViewPage;
