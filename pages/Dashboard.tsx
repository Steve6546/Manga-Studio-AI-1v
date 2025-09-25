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
import SimpleModal from '../components/SimpleModal';

const DashboardPage: React.FC = () => {
  const [mangaProjects, setMangaProjects] = useState<MangaDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
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

  const openDeleteModal = (id: string, title: string) => {
    setProjectToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
        await deleteMangaDocument(projectToDelete.id);
        toast.success(`تم حذف مشروع "${projectToDelete.title}" بنجاح.`);
        fetchMangaProjects(); // Refresh the list
    } catch (e) {
        console.error("Failed to delete project:", e);
        toast.error("فشل حذف المشروع.");
    } finally {
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
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
        <h1 className="text-3xl font-bold text-violet-400">مشاريع المانغا</h1>
        <Button onClick={() => navigate('/setup')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          ابدأ مشروع جديد
        </Button>
      </div>

      {isLoading && <Loader text="جاري تحميل المشاريع..." />}
      {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-md">{error}</p>}

      {!isLoading && !error && mangaProjects.length === 0 && (
        <div className="text-center text-slate-500 text-lg py-16 bg-slate-900 rounded-lg shadow-md border border-slate-800">
          <p className="text-4xl mb-4">✒️</p>
          <p className="text-xl font-semibold mb-2">لا توجد مشاريع بعد</p>
          <p className="mb-6">ابدأ الآن وحوّل أفكارك إلى قصص مصورة مذهلة!</p>
          <Button onClick={() => navigate('/setup')} size="lg">
            أنشئ مشروعك الأول
          </Button>
        </div>
      )}

      {!isLoading && !error && mangaProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mangaProjects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate text-violet-300">{project.title || "مشروع بدون عنوان"}</CardTitle>
                <CardDescription>{getLabel(project.artStyle, ART_STYLES_OPTIONS)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div className="text-sm text-slate-400 space-y-1">
                    <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-violet-500" /> ملخص: <span className="text-slate-300 truncate">{project.summary || 'لا يوجد'}</span></p>
                    <p className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-500" /> الفصول: <span className="text-slate-300">{project.chapters?.length || 0}</span></p>
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-violet-500" /> آخر تحديث: <span className="text-slate-300 text-xs">{new Date(project.updatedAt).toLocaleDateString('ar-EG')}</span></p>
                </div>
              </CardContent>
              <CardFooter className="flex-col !p-3 space-y-2">
                <Button onClick={() => navigateToProject(project)} className="w-full">
                  افتح الاستوديو <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
                 <div className="w-full grid grid-cols-3 gap-2">
                     <Button onClick={() => navigate(`/project/${project.id}/memory`)} variant="secondary" size="sm" className="w-full"><BrainCircuit className="h-4 w-4"/></Button>
                    <Button onClick={() => navigate(`/setup/${project.id}`)} variant="secondary" size="sm" className="w-full"><Settings className="h-4 w-4"/></Button>
                    <Button onClick={() => openDeleteModal(project.id, project.title)} variant="destructive" size="sm" className="w-full"><Trash2 className="h-4 w-4"/></Button>
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

      <SimpleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من رغبتك في حذف مشروع "${projectToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={confirmDeleteProject}
        confirmText="حذف"
        confirmVariant="destructive"
      />
    </div>
  );
};

export default DashboardPage;
