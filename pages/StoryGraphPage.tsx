import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType, Edge } from 'reactflow';
import { useMangaStore } from '../src/state/mangaStore';
import { Button } from '../components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { Wand2, Brain, Check } from 'lucide-react';
import { User, MapPin } from 'lucide-react';
import { googleAIController } from '../services/aiController';
import { StoryGraphConnectionSuggestion, CharacterMemory, CharacterRelationship } from '../types';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import Loader from '../components/Loader';

const CharacterNode = ({ data }: { data: { label: string; role?: string } }) => (
  <div className="p-3 rounded-lg bg-slate-800 border-2 border-violet-500 shadow-lg text-center w-40 nowheel">
    <User className="mx-auto mb-2 h-6 w-6 text-violet-400" />
    <div className="font-bold text-slate-100 truncate">{data.label}</div>
    {data.role && <div className="text-xs text-slate-400 truncate">{data.role}</div>}
  </div>
);

const PlaceNode = ({ data }: { data: { label: string } }) => (
  <div className="p-3 rounded-lg bg-slate-800 border-2 border-cyan-500 shadow-lg text-center w-40 nowheel">
    <MapPin className="mx-auto mb-2 h-6 w-6 text-cyan-400" />
    <div className="font-bold text-slate-100 truncate">{data.label}</div>
  </div>
);

const nodeTypes = {
  character: CharacterNode,
  place: PlaceNode,
};

const StoryGraphPage: React.FC = () => {
    const { mangaId } = useParams<{ mangaId: string }>();
    const navigate = useNavigate();
    const { currentMangaDocument: project, updateAndSaveMangaDocument, isLoading } = useMangaStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<StoryGraphConnectionSuggestion[]>([]);

    useEffect(() => {
        if (project?.storyMemory) {
            const { characters, world } = project.storyMemory;

            const characterNodes = characters.map((char, index) => ({
                id: `char-${char.id}`,
                type: 'character',
                data: { label: char.name, role: char.role },
                position: { x: 100, y: index * 150 + 50 },
            }));

            const placeNodes = world.places.map((place, index) => ({
                id: `place-${place.id}`,
                type: 'place',
                data: { label: place.name },
                position: { x: 500, y: index * 150 + 100 },
            }));

            const relationshipEdges: Edge[] = [];
            characters.forEach(char => {
                char.relationships?.forEach(rel => {
                    relationshipEdges.push({
                        id: `rel-${char.id}-${rel.characterId}`,
                        source: `char-${char.id}`,
                        target: `char-${rel.characterId}`,
                        label: rel.relationshipType,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed },
                    });
                });
            });

            setNodes([...characterNodes, ...placeNodes]);
            setEdges(relationshipEdges);
        }
    }, [project?.storyMemory, setNodes, setEdges]);
    
    const handleAnalyze = async () => {
        if (!project || !project.content) {
            toast.error("Story content is needed for analysis.");
            return;
        }
        setIsAnalyzing(true);
        const toastId = toast.loading("AI is analyzing connections...");
        try {
            const result = await googleAIController('suggest_story_graph_connections', {
                storyContent: project.content,
                storyMemory: project.storyMemory,
            });
            setSuggestions(result);
            toast.success(`Found ${result.length} new potential connections!`, { id: toastId });
        } catch (e: any) {
            toast.error(e.message, { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleApplySuggestion = async (suggestion: StoryGraphConnectionSuggestion) => {
        if (!project || suggestion.fromType !== 'character' || suggestion.toType !== 'character') {
            toast.error("Can only apply character-to-character relationships for now.");
            return;
        }

        const fromCharId = suggestion.fromId;
        const toCharId = suggestion.toId;

        const updatedCharacters = project.storyMemory.characters.map(char => {
            if (char.id === fromCharId) {
                const newRel: CharacterRelationship = {
                    characterId: toCharId,
                    relationshipType: suggestion.label,
                    description: suggestion.reasoning
                };
                const updatedRels = [...(char.relationships || []), newRel];
                return { ...char, relationships: updatedRels };
            }
            return char;
        });

        await updateAndSaveMangaDocument({
            storyMemory: { ...project.storyMemory, characters: updatedCharacters }
        });

        setSuggestions(s => s.filter(s => s !== suggestion));
        toast.success("Relationship added!");
    };


    if (isLoading && !project) return <Loader text="Loading Story Graph..." />;

    return (
        <>
        <Modal isOpen={suggestions.length > 0} onClose={() => setSuggestions([])} title="AI Connection Suggestions">
            <div className="space-y-3">
                <p className="text-sm text-slate-400">The AI has analyzed your story and found these potential new relationships. Add the ones you like to your Story Memory.</p>
                {suggestions.map((s, i) => {
                    const fromNode = nodes.find(n => n.id === `char-${s.fromId}`)?.data?.label || 'Unknown';
                    const toNode = nodes.find(n => n.id === `char-${s.toId}`)?.data?.label || 'Unknown';
                    return (
                        <div key={i} className="p-3 bg-slate-800/50 rounded-md">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-grow">
                                    <p className="font-semibold text-violet-300">
                                        {fromNode} → {s.label} → {toNode}
                                    </p>
                                    <p className="text-xs text-slate-400 italic mt-1">{s.reasoning}</p>
                                </div>
                                <Button size="sm" onClick={() => handleApplySuggestion(s)}><Check className="mr-2 h-4 w-4"/> Add</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>

        <div className="h-full flex flex-col gap-4">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-violet-400">Story Graph</h1>
                    <p className="text-slate-400">Visualize the connections in your narrative universe.</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="secondary" onClick={() => navigate(`/project/${mangaId}/memory`)}>
                        <Brain className="mr-2 h-4 w-4" />
                        Manage in Memory Editor
                    </Button>
                    <Button onClick={handleAnalyze} isLoading={isAnalyzing} disabled={!project?.content}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Analyze Connections
                    </Button>
                </div>
            </header>
            <div className="flex-grow rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-950"
                >
                    <Controls />
                    <MiniMap nodeStrokeWidth={3} zoomable pannable />
                    <Background color="#4338ca" gap={16} />
                </ReactFlow>
            </div>
        </div>
        </>
    );
};

export default StoryGraphPage;
