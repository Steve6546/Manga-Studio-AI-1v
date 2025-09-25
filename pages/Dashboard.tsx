import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getAllMangaDocumentIds, getMangaDocument, deleteMangaDocument } from '../services/db';
// FIX: Corrected import path
import { MangaDocument } from '../types';
// FIX: Corrected import path
import { ART_STYLES_OPTIONS } from '../constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { PlusCircle, FileText, CalendarDays, BrainCircuit, Trash2, Settings, ArrowRight, RefreshCw, BookOpen } from 'lucide-react';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [mangaProjects, setMangaProjects] = useState<MangaDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const getLabel = (value: string, options: { value: string, label: string }[]) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  const fetchMangaProjects = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const ids = await getAllMangaDocumentIds();
      const projectsPromises = ids.map(id => getMangaDocument(id));
      const projectsResults = await Promise.all(projectsPromises);
      const validProjects = projectsResults.filter(project => project !== undefined) as MangaDocument[];
      setMangaProjects(validProjects);
      if (showToast) toast.success("تم تحديث قائمة المشاريع!");
    } catch (err) {
      console.error("Failed to fetch manga projects:", err);
      const msg = "فشل في تحميل قائمة المشاريع.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMangaProjects();
  }, [fetchMangaProjects]);

  const handleDeleteProject = async (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف مشروع "${title}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        try {
            await deleteMangaDocument(id);
            toast.success(`تم حذف مشروع "${title}" بنجاح.`);
            fetchMangaProjects(); // Refresh the list
        } catch (e) {
            console.error("Failed to delete project:", e);
            toast.error("فشل حذف المشروع.");
        }
    }
  };

  const navigateToProject = (project: MangaDocument) => {
      const firstChapter = project.chapters?.[0];
      const firstPage = firstChapter?.pages?.[0];
      if (firstChapter && firstPage) {
          navigate(`/project/${project.id}/chapter/${firstChapter.chapterNumber}/page/${firstPage.pageNumber}`);
      } else {
          // If no pages exist, navigate to setup to generate them
          navigate(`/setup/${project.id}`);
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">مشاريع المانغا</h1>
        <Button onClick={() => navigate('/setup')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          ابدأ مشروع جديد
        </Button>
      </div>

      {isLoading && <Loader text="جاري تحميل المشاريع..." />}
      {error && <p className="text-center text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

      {!isLoading && !error && mangaProjects.length === 0 && (
        <div className="text-center text-muted-foreground text-lg py-16 bg-card rounded-lg border border-dashed">
          <p className="text-4xl mb-4">✒️</p>
          <p className="text-xl font-semibold mb-2 text-foreground">لا توجد مشاريع بعد</p>
          <p className="mb-6">ابدأ الآن وحوّل أفكارك إلى قصص مصورة مذهلة!</p>
          <Button onClick={() => navigate('/setup')} size="lg">
            أنشئ مشروعك الأول
          </Button>
        </div>
      )}

      {!isLoading && !error && mangaProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mangaProjects.map((project) => (
            <Card key={project.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="truncate text-foreground">{project.title || "مشروع بدون عنوان"}</CardTitle>
                <CardDescription>{getLabel(project.artStyle, ART_STYLES_OPTIONS)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> ملخص: <span className="text-foreground/80 truncate">{project.summary || 'لا يوجد'}</span></p>
                    <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> الفصول: <span className="text-foreground/80">{project.chapters?.length || 0}</span></p>
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> آخر تحديث: <span className="text-foreground/80 text-xs">{new Date(project.updatedAt).toLocaleDateString('ar-EG')}</span></p>
                </div>
              </CardContent>
              <CardFooter className="flex-col !p-3 space-y-2 mt-auto">
                <Button onClick={() => navigateToProject(project)} className="w-full">
                  افتح الاستوديو <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
                 <div className="w-full grid grid-cols-3 gap-2">
                     <Button onClick={() => navigate(`/project/${project.id}/memory`)} variant="secondary" size="sm" className="w-full"><BrainCircuit className="h-4 w-4"/></Button>
                    <Button onClick={() => navigate(`/setup/${project.id}`)} variant="secondary" size="sm" className="w-full"><Settings className="h-4 w-4"/></Button>
                    <Button onClick={() => handleDeleteProject(project.id, project.title)} variant="destructive" size="sm" className="w-full"><Trash2 className="h-4 w-4"/></Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Button onClick={() => fetchMangaProjects(true)} variant="outline" isLoading={isLoading}>
          <RefreshCw className="ml-2 h-4 w-4" />
          تحديث القائمة
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
