import React, { useState, useEffect, useRef } from 'react';
import { useMangaStore } from '../src/state/mangaStore';
import { googleAIController } from '../services/aiController'; 
import { AIPromptInputs, PlotSuggestion, AIOutputTypes } from '../types'; 
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import toast from 'react-hot-toast';
import { Wand2, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

const EditorPage: React.FC = () => {
  const { 
    currentMangaDocument, 
    updateAndSaveMangaDocument,
  } = useMangaStore();

  const [localContent, setLocalContent] = useState(currentMangaDocument?.content || "");
  const [isGeneratingContinuation, setIsGeneratingContinuation] = useState(false);
  const [isSuggestingPlot, setIsSuggestingPlot] = useState(false);
  const [plotSuggestion, setPlotSuggestion] = useState<PlotSuggestion | null>(null);
  
  const debounceTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Sync local state when the document in the store changes
    setLocalContent(currentMangaDocument?.content || "");
  }, [currentMangaDocument?.id, currentMangaDocument?.content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      if (currentMangaDocument && newContent !== currentMangaDocument.content) {
        updateAndSaveMangaDocument({ content: newContent });
      }
    }, 1500); // 1.5 seconds debounce
  };

  const handleContinueStory = async () => {
    if (!currentMangaDocument || !localContent) {
      toast.error("لا يوجد محتوى لمتابعة النص السردي.");
      return;
    }
    setIsGeneratingContinuation(true);
    const toastId = toast.loading("جاري توليد تكملة للقصة...");
    try {
      const continuationInput: AIPromptInputs["generate_story_continuation"] = { 
        currentStoryContent: localContent,
        storyMemory: currentMangaDocument.storyMemory 
      };
      const continuation = await googleAIController("generate_story_continuation", continuationInput) as AIOutputTypes["generate_story_continuation"];
      
      const newFullContent = (localContent || "") + '\n\n' + continuation;
      setLocalContent(newFullContent); // Update local state immediately
      await updateAndSaveMangaDocument({ content: newFullContent });
      toast.success("تمت إضافة التكملة بنجاح!", { id: toastId });

    } catch (e: any) {
      toast.error(`فشل متابعة النص: ${e.message || String(e)}`, { id: toastId });
    } finally {
      setIsGeneratingContinuation(false);
    }
  };

  const handleSuggestPlotPoint = async () => {
    if (!currentMangaDocument || !localContent) {
      toast.error("لا يوجد محتوى كافٍ لاقتراح حدث جديد.");
      return;
    }
    setIsSuggestingPlot(true);
    const toastId = toast.loading("...جاري التفكير في حدث جديد");
    try {
      const input: AIPromptInputs["suggest_plot_point"] = {
        currentStoryContent: localContent,
        storyTitle: currentMangaDocument.title,
        storyMemory: currentMangaDocument.storyMemory 
      };
      const suggestion = await googleAIController("suggest_plot_point", input) as AIOutputTypes["suggest_plot_point"];
      setPlotSuggestion(suggestion);
      toast.dismiss(toastId);
    } catch (e: any) {
      toast.error(`فشل اقتراح حدث: ${e.message || "خطأ غير معروف"}`, { id: toastId });
    } finally {
      setIsSuggestingPlot(false);
    }
  };
  
  return (
    <>
      <Modal
        isOpen={!!plotSuggestion}
        onClose={() => setPlotSuggestion(null)}
        title="💡 اقتراح حدث جديد للقصة"
      >
         {plotSuggestion && <>
            <p className="text-slate-300 whitespace-pre-wrap">{plotSuggestion.suggestion}</p>
            {plotSuggestion.reasoning && <p className="mt-2 text-sm text-slate-400 italic">{plotSuggestion.reasoning}</p>}
          </>}
      </Modal>

      <div className="h-full flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold text-violet-400">محرر النص السردي</h1>
          <p className="text-slate-400">هنا يمكنك تحرير النص العام للقصة. سيتم استخدامه كمرجع لتوليد اللوحات وتطورات القصة.</p>
        </header>

        <Card className="flex-grow flex flex-col bg-slate-900/70 border-slate-800">
            <CardContent className="p-2 flex-grow flex flex-col">
                 <Textarea
                    value={localContent}
                    onChange={handleContentChange}
                    placeholder="اكتب النص السردي العام لقصتك هنا..."
                    className="flex-grow w-full p-4 bg-transparent text-slate-100 border-none rounded-md text-lg leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={isGeneratingContinuation || isSuggestingPlot}
                />
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleContinueStory}
            isLoading={isGeneratingContinuation}
            disabled={!localContent.trim() || isSuggestingPlot}
            className="w-full"
          >
            <Wand2 className="ml-2 h-4 w-4" />
            متابعة النص بالذكاء الاصطناعي
          </Button>
           <Button
            onClick={handleSuggestPlotPoint}
            isLoading={isSuggestingPlot}
            disabled={!localContent.trim() || isGeneratingContinuation}
            variant="secondary"
            className="w-full"
          >
            <Lightbulb className="ml-2 h-4 w-4" />
            اقتراح حدث جديد
          </Button>
        </div>
      </div>
    </>
  );
};

export default EditorPage;
