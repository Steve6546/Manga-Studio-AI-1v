

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { MangaDocument, StoryMemory, Chapter, PanelLayoutType } // Updated import
from '../types';
import { DB_NAME, DB_VERSION, MANGA_PROJECTS_STORE_NAME, DEFAULT_PANEL_LAYOUT } from '../constants';

interface StoryFactoryDBSchema extends DBSchema {
  [MANGA_PROJECTS_STORE_NAME]: { // Updated store name
    key: string;
    value: MangaDocument;
    indexes: { createdAt: number; updatedAt: number }; 
  };
}

let dbPromise: Promise<IDBPDatabase<StoryFactoryDBSchema>>;

const getDefaultStoryMemory = (): StoryMemory => ({
  characters: [],
  world: {
    places: [],
    majorEvents: [],
    timelineNotes: '',
    lore: '',
  },
  theme: '',
  overallStyleNotes: '',
});

const getDefaultChapters = (): Chapter[] => [{
  chapterNumber: 1,
  pages: [{
    pageNumber: 1,
    layout: DEFAULT_PANEL_LAYOUT, // Default layout
    panels: []
  }]
}];


const initDB = (): Promise<IDBPDatabase<StoryFactoryDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<StoryFactoryDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1 && !db.objectStoreNames.contains(MANGA_PROJECTS_STORE_NAME)) {
           // For fresh installs or if migrating from a very old version (hypothetically)
          const store = db.createObjectStore(MANGA_PROJECTS_STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
        }
        
        if (oldVersion < 2) { // Migration for Sprint 8 changes
            if (db.objectStoreNames.contains('factories' as any) && !db.objectStoreNames.contains(MANGA_PROJECTS_STORE_NAME)) { // Use 'as any' for old name check if it's not in schema
                // Attempt to rename or guide user, for simplicity here we create new if old name exists
                // In a real app, data migration from 'factories' to 'manga_projects' would be needed.
                // For this exercise, assume 'factories' store is to be replaced by 'manga_projects'.
                // If 'factories' exists, we might delete it or leave it, then create the new one.
                // FIX: Commented out as 'factories' is not a valid key for deleteObjectStore per DBSchema
                // db.deleteObjectStore('factories'); // Example of removing old store
                console.warn("Old 'factories' store detected. Data migration might be needed. Creating new store 'manga_projects'.");
            }

            if (!db.objectStoreNames.contains(MANGA_PROJECTS_STORE_NAME)) {
                 const store = db.createObjectStore(MANGA_PROJECTS_STORE_NAME, { keyPath: 'id' });
                 store.createIndex('createdAt', 'createdAt');
                 store.createIndex('updatedAt', 'updatedAt');
            } else {
                // Ensure indexes exist if store was somehow created without them
                const store = transaction.objectStore(MANGA_PROJECTS_STORE_NAME);
                if (!store.indexNames.contains('createdAt')) {
                    store.createIndex('createdAt', 'createdAt');
                }
                if (!store.indexNames.contains('updatedAt')) {
                    store.createIndex('updatedAt', 'updatedAt');
                }
            }
        }
      },
    });
  }
  return dbPromise;
};

export const saveMangaDocument = async (
  id: string,
  data: Omit<MangaDocument, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<MangaDocument, 'createdAt'>>, 
  existingCreatedAt?: number
): Promise<void> => {
  const db = await initDB();
  const mangaDoc: MangaDocument = {
    id,
    title: data.title,
    artStyle: data.artStyle,
    environment: data.environment, // Kept for theme
    season: data.season || undefined, // Kept for grouping, less direct manga use
    episode: data.episode || undefined, // Kept for grouping
    createdAt: existingCreatedAt !== undefined ? existingCreatedAt : (data.createdAt || Date.now()),
    updatedAt: Date.now(), 
    summary: data.summary || undefined,
    content: data.content || undefined, // Overall narrative text
    contentHistory: data.contentHistory || [],
    visualStyleKey: data.visualStyleKey, // Default style
    chapters: data.chapters && data.chapters.length > 0 ? data.chapters : getDefaultChapters(),
    storyMemory: data.storyMemory || getDefaultStoryMemory(),
  };
  await db.put(MANGA_PROJECTS_STORE_NAME, mangaDoc);
};

export const getAllMangaDocumentIds = async (): Promise<string[]> => {
  const db = await initDB();
  // Check if store exists before trying to access it, especially after upgrade logic
  if (!db.objectStoreNames.contains(MANGA_PROJECTS_STORE_NAME)) {
    console.warn(`Store ${MANGA_PROJECTS_STORE_NAME} not found. Returning empty list.`);
    return [];
  }
  const allDocs = await db.getAllFromIndex(MANGA_PROJECTS_STORE_NAME, 'updatedAt');
  return allDocs.map(doc => doc.id).reverse(); 
};

export const getMangaDocument = async (id: string): Promise<MangaDocument | undefined> => {
  const db = await initDB();
  if (!db.objectStoreNames.contains(MANGA_PROJECTS_STORE_NAME)) {
    console.warn(`Store ${MANGA_PROJECTS_STORE_NAME} not found. Cannot get document.`);
    return undefined;
  }
  const doc = await db.get(MANGA_PROJECTS_STORE_NAME, id);
  if (doc) {
    if (!doc.storyMemory) { 
      doc.storyMemory = getDefaultStoryMemory();
    }
    if (!doc.chapters || doc.chapters.length === 0) {
      doc.chapters = getDefaultChapters();
    }
  }
  return doc;
};

export const deleteMangaDocument = async (id: string): Promise<void> => {
  const db = await initDB();
   if (!db.objectStoreNames.contains(MANGA_PROJECTS_STORE_NAME)) {
    console.warn(`Store ${MANGA_PROJECTS_STORE_NAME} not found. Cannot delete document.`);
    return;
  }
  await db.delete(MANGA_PROJECTS_STORE_NAME, id);
};

// Previous functions aliased for a smoother transition if any code still uses old names (temporary)
export const saveFactory = saveMangaDocument;
export const getFactory = getMangaDocument;
export const getAllFactoryIds = getAllMangaDocumentIds;
export const deleteFactory = deleteMangaDocument;