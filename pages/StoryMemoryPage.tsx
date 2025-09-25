import React, { useState, useEffect } from 'react';
import { useMangaStore } from '../src/state/mangaStore';
// FIX: Corrected import path
import { googleAIController } from '../services/aiController';
import { 
    CharacterMemory, WorldPlace, WorldEvent, SuggestedMemoryUpdates, StoryMemory,
    CharacterArcSuggestion
// FIX: Corrected import path
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import Loader from '../components/Loader';
import CharacterForm from '../components/CharacterForm';
import WorldPlaceForm from '../components/WorldPlaceForm';
import WorldEventForm from '../components/WorldEventForm';
import { Edit, PlusCircle, Trash2, Wand2, Lightbulb } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

type EditState = 
    | { type: 'character'; data?: CharacterMemory }
    | { type: 'place'; data?: WorldPlace }
    | { type: 'event'; data?: WorldEvent }
    | null;

const StoryMemoryPage: React.FC = () => {
    const { currentMangaDocument: project, updateAndSaveMangaDocument, isLoading } = useMangaStore();
    
    const [memory, setMemory] = useState<StoryMemory | null>(project?.storyMemory || null);
    const [editState, setEditState] = useState<EditState>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestedMemoryUpdates | null>(null);
    const [arcSuggestions, setArcSuggestions] = useState<CharacterArcSuggestion | null>(null);
    const [analyzingCharacter, setAnalyzingCharacter] = useState<CharacterMemory | null>(null);


    useEffect(() => {
        if (project?.storyMemory) {
            setMemory(project.storyMemory);
        }
    }, [project?.storyMemory]);

    const handleSaveMemory = async (updatedMemoryFields: Partial<StoryMemory>) => {
        if (!memory) return;
        const newMemory = { ...memory, ...updatedMemoryFields, world: { ...memory.world, ...(updatedMemoryFields.world || {}) } };
        setMemory(newMemory);
        await updateAndSaveMangaDocument({ storyMemory: newMemory });
    };

    const handleFormSave = (item: CharacterMemory | WorldPlace | WorldEvent) => {
        if (!memory || !editState) return;
        let updatedMemory: StoryMemory = JSON.parse(JSON.stringify(memory));

        switch (editState.type) {
            case 'character':
                const char = item as CharacterMemory;
                const charIndex = memory.characters.findIndex(c => c.id === char.id);
                if (charIndex > -1) {
                    updatedMemory.characters[charIndex] = char;
                } else {
                    updatedMemory.characters.push({ ...char, id: char.id || uuidv4() });
                }
                break;
            case 'place':
                const place = item as WorldPlace;
                const placeIndex = memory.world.places.findIndex(p => p.id === place.id);
                if (placeIndex > -1) {
                    updatedMemory.world.places[placeIndex] = place;
                } else {
                    updatedMemory.world.places.push({ ...place, id: place.id || uuidv4() });
                }
                break;
            case 'event':
                const event = item as WorldEvent;
                const eventIndex = memory.world.majorEvents.findIndex(e => e.id === event.id);
                if (eventIndex > -1) {
                    updatedMemory.world.majorEvents[eventIndex] = event;
                } else {
                    updatedMemory.world.majorEvents.push({ ...event, id: event.id || uuidv4() });
                }
                break;
        }
        
        handleSaveMemory(updatedMemory);
        setEditState(null);
    };
    
    const handleDelete = (type: 'character' | 'place' | 'event', id: string) => {
        if (!memory) return;
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        let updatedMemory = JSON.parse(JSON.stringify(memory)); // deep copy

        switch (type) {
            case 'character':
                updatedMemory.characters = updatedMemory.characters.filter((c: CharacterMemory) => c.id !== id);
                break;
            case 'place':
                updatedMemory.world.places = updatedMemory.world.places.filter((p: WorldPlace) => p.id !== id);
                break;
            case 'event':
                updatedMemory.world.majorEvents = updatedMemory.world.majorEvents.filter((e: WorldEvent) => e.id !== id);
                break;
        }
        handleSaveMemory(updatedMemory);
    };

    const handleAnalyzeWithAI = async () => {
        if (!project || !project.content) {
            toast.error("There is not enough story content to analyze.");
            return;
        }
        setIsAiLoading(true);
        const toastId = toast.loading("Analyzing story and generating suggestions...");
        try {
            const result = await googleAIController('analyze_and_suggest_memory_updates', {
                currentStoryContent: project.content,
                existingStoryMemory: project.storyMemory,
            });
            setSuggestions(result);
            toast.success("Suggestions generated!", { id: toastId });
        } catch (e: any) {
            toast.error(e.message || "Failed to get suggestions.", { id: toastId });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleApplySuggestion = (suggestion: any, type: 'character' | 'place' | 'event') => {
        if (!memory) return;
        const newItem = { ...suggestion, id: uuidv4() };
        let updatedMemory = JSON.parse(JSON.stringify(memory));

        switch(type) {
            case 'character':
                updatedMemory.characters.push(newItem);
                break;
            case 'place':
                updatedMemory.world.places.push(newItem);
                break;
            case 'event':
                updatedMemory.world.majorEvents.push(newItem);
                break;
        }
        handleSaveMemory(updatedMemory);
        toast.success(`${type} "${newItem.name || newItem.description}" added!`);
    };

    const handleSuggestArc = async (character: CharacterMemory) => {
        if (!project || !project.content) {
            toast.error("Story content is needed to suggest arcs.");
            return;
        }
        setAnalyzingCharacter(character);
        setIsAiLoading(true);
        const toastId = toast.loading(`Getting suggestions for ${character.name}...`);
        try {
            const result = await googleAIController('suggest_character_arc', {
                character,
                allCharacters: memory?.characters,
                storyContext: project.content,
            });
            setArcSuggestions(result);
            toast.success("Suggestions ready!", { id: toastId });
        } catch (e: any) {
            toast.error(e.message || "Failed to get suggestions.", { id: toastId });
        } finally {
            setIsAiLoading(false);
        }
    };

    const renderEditModal = () => {
        if (!editState) return null;
        const commonProps = {
            onCancel: () => setEditState(null),
            onSave: handleFormSave,
        };
        switch (editState.type) {
            case 'character':
                return <CharacterForm {...commonProps} character={editState.data} />;
            case 'place':
                return <WorldPlaceForm {...commonProps} place={editState.data} />;
            case 'event':
                return <WorldEventForm {...commonProps} eventItem={editState.data} />;
            default:
                return null;
        }
    };


    if (isLoading && !project) return <Loader text="Loading story memory..." />;
    if (!project || !memory) return <div>No project loaded.</div>;

    return (
        <>
            <Modal isOpen={!!editState} onClose={() => setEditState(null)} title={editState ? `Edit ${editState.type}` : ''}>
                {renderEditModal()}
            </Modal>

            <Modal isOpen={!!suggestions} onClose={() => setSuggestions(null)} title="AI Suggestions for Story Memory">
                {suggestions && (
                    <div className="space-y-4">
                        <p className="text-sm italic text-slate-400">{suggestions.analysisSummary}</p>
                        {suggestions.suggestedCharacters.length > 0 && <div>
                            <h4 className="font-semibold mb-2">Suggested Characters</h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.suggestedCharacters.map(c => <Button key={c.name} size="sm" variant="secondary" onClick={() => handleApplySuggestion(c, 'character')}>Add {c.name}</Button>)}
                            </div>
                        </div>}
                        {suggestions.suggestedPlaces.length > 0 && <div>
                            <h4 className="font-semibold mb-2">Suggested Places</h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.suggestedPlaces.map(p => <Button key={p.name} size="sm" variant="secondary" onClick={() => handleApplySuggestion(p, 'place')}>Add {p.name}</Button>)}
                            </div>
                        </div>}
                        {suggestions.suggestedEvents.length > 0 && <div>
                             <h4 className="font-semibold mb-2">Suggested Events</h4>
                            <div className="flex flex-col gap-2">
                                {suggestions.suggestedEvents.map(e => <Button key={e.description} size="sm" variant="secondary" onClick={() => handleApplySuggestion(e, 'event')}>Add: "{e.description.slice(0,30)}..."</Button>)}
                            </div>
                        </div>}
                    </div>
                )}
            </Modal>

            <Modal 
                isOpen={!!arcSuggestions && !!analyzingCharacter} 
                onClose={() => {
                    setArcSuggestions(null);
                    setAnalyzingCharacter(null);
                }} 
                title={`💡 Arc Suggestions for ${analyzingCharacter?.name}`}
            >
                {arcSuggestions && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-violet-300 mb-2">Potential Arcs</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {arcSuggestions.arcSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-violet-300 mb-2">Relationship Developments</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {arcSuggestions.relationshipSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="space-y-6">
                <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-violet-400">Story Memory</h1>
                        <p className="text-slate-400">The central knowledge base for your story's AI.</p>
                    </div>
                    <Button onClick={handleAnalyzeWithAI} isLoading={isAiLoading}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Analyze & Suggest
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Characters */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Characters</CardTitle>
                                <CardDescription>The people who drive your story.</CardDescription>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => setEditState({ type: 'character' })}><PlusCircle className="h-5 w-5"/></Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {memory.characters.map(char => (
                                <div key={char.id} className="p-3 bg-slate-800/50 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-violet-300">{char.name} <span className="text-sm text-slate-400 font-normal">{char.role && `(${char.role})`}</span></h4>
                                            <p className="text-xs text-slate-400">{char.description}</p>
                                            {char.traits && <div className="mt-1 flex flex-wrap gap-1">{char.traits.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-yellow-400 hover:text-yellow-300" onClick={() => handleSuggestArc(char)} title="Suggest Arc"><Lightbulb className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditState({ type: 'character', data: char })}><Edit className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDelete('character', char.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {memory.characters.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No characters defined yet.</p>}
                        </CardContent>
                    </Card>

                    {/* World */}
                    <div className="space-y-6">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>World Places</CardTitle>
                                    <CardDescription>Key locations in your story.</CardDescription>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => setEditState({ type: 'place' })}><PlusCircle className="h-5 w-5"/></Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {memory.world.places.map(place => (
                                    <div key={place.id} className="p-3 bg-slate-800/50 rounded-md">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-slate-200">{place.name}</h4>
                                                <p className="text-xs text-slate-400">{place.description}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditState({ type: 'place', data: place })}><Edit className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDelete('place', place.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {memory.world.places.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No places defined yet.</p>}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Major Events</CardTitle>
                                    <CardDescription>Pivotal moments in the timeline.</CardDescription>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => setEditState({ type: 'event' })}><PlusCircle className="h-5 w-5"/></Button>
                            </CardHeader>
                             <CardContent className="space-y-3">
                                {memory.world.majorEvents.map(event => (
                                     <div key={event.id} className="p-3 bg-slate-800/50 rounded-md">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-slate-300 flex-grow">{event.description}</p>
                                            <div className="flex gap-1 flex-shrink-0 ml-2">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditState({ type: 'event', data: event })}><Edit className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDelete('event', event.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {memory.world.majorEvents.length === 0 && <p className="text-center text-slate-500 text-sm py-4">No major events defined yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* General Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                        <CardDescription>Overall themes, notes, and lore for the story.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="theme">Theme</Label>
                                <Textarea id="theme" value={memory.theme || ''} onChange={(e) => setMemory(m => m && ({...m, theme: e.target.value}))} onBlur={() => handleSaveMemory({ theme: memory.theme })} />
                            </div>
                            <div>
                                <Label htmlFor="styleNotes">Overall Style Notes</Label>
                                <Textarea id="styleNotes" value={memory.overallStyleNotes || ''} onChange={(e) => setMemory(m => m && ({...m, overallStyleNotes: e.target.value}))} onBlur={() => handleSaveMemory({ overallStyleNotes: memory.overallStyleNotes })} />
                            </div>
                        </div>
                        <div>
                             <Label htmlFor="lore">World Lore</Label>
                             <Textarea id="lore" value={memory.world.lore || ''} onChange={(e) => setMemory(m => m && ({...m, world: {...m.world, lore: e.target.value}}))} rows={4} onBlur={() => handleSaveMemory({ world: memory.world })} />
                        </div>
                         <div>
                             <Label htmlFor="timeline">Timeline Notes</Label>
                             <Textarea id="timeline" value={memory.world.timelineNotes || ''} onChange={(e) => setMemory(m => m && ({...m, world: {...m.world, timelineNotes: e.target.value}}))} rows={2} onBlur={() => handleSaveMemory({ world: memory.world })} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default StoryMemoryPage;
