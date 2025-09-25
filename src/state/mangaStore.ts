import { create } from 'zustand';
import { MangaDocument, Panel, Chapter } from '../types';
import { getMangaDocument, saveMangaDocument } from '../../services/db';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { DEFAULT_PANEL_LAYOUT } from '../../constants';

interface MangaStoreState {
  currentMangaDocument: MangaDocument | null;
  isLoading: boolean;
  error: string | null;
  loadMangaDocument: (mangaId: string) => Promise<void>;
  clearCurrentMangaDocument: () => void;
  updatePanel: (chapterNumber: number, pageNumber: number, updatedPanel: Panel, save?: boolean) => Promise<void>;
  updateAndSaveMangaDocument: (updatedFields: Partial<Omit<MangaDocument, 'id' | 'createdAt'>>) => Promise<void>;
  addChapter: (title: string) => Promise<{ newChapterNumber: number; newPageNumber: number } | null>;
}

export const useMangaStore = create<MangaStoreState>((set, get) => ({
  currentMangaDocument: null,
  isLoading: false,
  error: null,

  loadMangaDocument: async (mangaId: string) => {
    set({ isLoading: true, error: null, currentMangaDocument: null });
    try {
      const doc = await getMangaDocument(mangaId);
      if (doc) {
        set({ currentMangaDocument: doc, isLoading: false });
      } else {
        const errorMsg = `لم يتم العثور على مشروع مانغا بالمعرّف ${mangaId}.`;
        set({ error: errorMsg, isLoading: false });
        toast.error(errorMsg);
      }
    } catch (e: any) {
      console.error("Failed to load manga document into store:", e);
      const errorMsg = e.message || "فشل في تحميل مشروع المانغا.";
      set({ error: errorMsg, isLoading: false });
      toast.error(errorMsg);
    }
  },

  clearCurrentMangaDocument: () => {
    set({ currentMangaDocument: null, error: null, isLoading: false });
  },
  
  updatePanel: async (chapterNumber: number, pageNumber: number, updatedPanel: Panel, save: boolean = false) => {
    const { currentMangaDocument } = get();
    if (!currentMangaDocument) return;

    const newDoc = JSON.parse(JSON.stringify(currentMangaDocument)); // Deep copy to ensure reactivity
    
    const chapterIndex = newDoc.chapters.findIndex((c: { chapterNumber: number; }) => c.chapterNumber === chapterNumber);
    if (chapterIndex === -1) return;

    const pageIndex = newDoc.chapters[chapterIndex].pages.findIndex((p: { pageNumber: number; }) => p.pageNumber === pageNumber);
    if (pageIndex === -1) return;

    const panelIndex = newDoc.chapters[chapterIndex].pages[pageIndex].panels.findIndex((p: { panelOrder: number; }) => p.panelOrder === updatedPanel.panelOrder);
    if (panelIndex === -1) { // If panel doesn't exist, add it (edge case)
        newDoc.chapters[chapterIndex].pages[pageIndex].panels.push(updatedPanel);
    } else {
        newDoc.chapters[chapterIndex].pages[pageIndex].panels[panelIndex] = updatedPanel;
    }
    
    set({ currentMangaDocument: newDoc });

    if (save) {
      // Use the save function which handles its own toasts
      await get().updateAndSaveMangaDocument({ chapters: newDoc.chapters });
    }
  },

  updateAndSaveMangaDocument: async (updatedFields: Partial<Omit<MangaDocument, 'id' | 'createdAt'>>) => {
    const { currentMangaDocument } = get();
    if (!currentMangaDocument) {
      toast.error("لا يوجد مشروع حالي للحفظ.");
      return;
    }
    
    const newDocumentState: MangaDocument = {
        ...currentMangaDocument,
        ...updatedFields,
        updatedAt: Date.now(),
    };
    
    // Optimistically update the state
    set({ currentMangaDocument: newDocumentState });

    const savingPromise = new Promise(async (resolve, reject) => {
        try {
            const { id, createdAt, ...payload } = newDocumentState;
            await saveMangaDocument(id, payload, createdAt);
            resolve("تم الحفظ بنجاح!");
        } catch (e: any) {
            console.error("Failed to update and save manga document from store:", e);
            const errorMsg = e.message || "فشل في حفظ مشروع المانغا.";
            set({ error: errorMsg }); // Optionally set error state
            reject(new Error(errorMsg));
        }
    });
    
    toast.promise(savingPromise, {
        loading: 'جاري الحفظ...',
        success: (msg) => `${msg}`,
        error: (err) => `${err.message}`,
    });

    try {
        await savingPromise;
    } catch (e) {
      // Re-throw if the caller needs to handle it
      throw e;
    }
  },

  addChapter: async (title: string) => {
    const { currentMangaDocument, updateAndSaveMangaDocument } = get();
    if (!currentMangaDocument) {
      toast.error("No project loaded to add a chapter to.");
      return null;
    }

    const existingChapters = currentMangaDocument.chapters || [];
    const newChapterNumber =
      existingChapters.length > 0
        ? Math.max(...existingChapters.map((c) => c.chapterNumber)) + 1
        : 1;

    const newPage = {
      pageNumber: 1,
      layout: DEFAULT_PANEL_LAYOUT,
      panels: [],
    };

    const newChapter: Chapter = {
      chapterNumber: newChapterNumber,
      title: title,
      pages: [newPage],
    };

    const newChapters = [...existingChapters, newChapter];

    try {
      await updateAndSaveMangaDocument({ chapters: newChapters });
      toast.success(`Chapter ${newChapterNumber}: "${title}" added successfully!`);
      return { newChapterNumber, newPageNumber: 1 };
    } catch (e) {
      // The save function already shows an error toast.
      return null;
    }
  },
}));