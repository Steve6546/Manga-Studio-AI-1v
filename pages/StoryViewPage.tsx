import React, { useState } from 'react';
import { useMangaStore } from '../src/state/mangaStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { googleAIController } from '../services/aiController';
import { StoryFeedback } from '../types';
import toast from 'react-hot-toast';
import { Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

const StoryViewPage: React.FC = () => {
    const { currentMangaDocument: project, isLoading } = useMangaStore();
    const navigate = useNavigate();

    const [feedback, setFeedback] = useState<StoryFeedback | null>(null);
    const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);

    const handleGetFeedback = async () => {
        if (!project || !project.content) {
            toast.error("Story content is required to get feedback.");
            return;
        }
        setIsFetchingFeedback(true);
        const toastId = toast.loading("AI is analyzing your story...");
        try {
            const result = await googleAIController('get_story_feedback', {
                storyTitle: project.title,
                storySummary: project.summary,
                storyContent: project.content,
                storyMemory: project.storyMemory,
            });
            setFeedback(result);
            toast.success("Feedback generated!", { id: toastId });
        } catch (e: any) {
            toast.error(e.message || "Failed to get feedback.", { id: toastId });
        } finally {
            setIsFetchingFeedback(false);
        }
    };
    
    const handleFeedbackChange = (field: keyof StoryFeedback, value: string, index?: number) => {
        if (!feedback) return;

        const newFeedback = { ...feedback };

        if (index !== undefined) {
            if (field === 'positivePoints' || field === 'areasForImprovement') {
                (newFeedback[field] as string[])[index] = value;
            }
        } else {
             if (field === 'overallAssessment') {
                newFeedback[field] = value;
            }
        }
        setFeedback(newFeedback);
    };


    if (isLoading && !project) {
        return <Loader text="Loading story details..." />;
    }

    if (!project) {
        return (
            <div className="text-center">
                <p>No project loaded. Please select a project from the dashboard.</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-violet-400">{project.title}</h1>
                    <p className="text-slate-400">Story Overview</p>
                </div>
                <Button onClick={handleGetFeedback} isLoading={isFetchingFeedback} disabled={!project.content}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get Story Feedback
                </Button>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-300 whitespace-pre-wrap">{project.summary || 'No summary available.'}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Full Narrative</CardTitle>
                    <CardDescription>This is the main text used for generating panels.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto">{project.content || 'No narrative content written yet.'}</p>
                </CardContent>
            </Card>

             {(isFetchingFeedback || feedback) && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Story Feedback</CardTitle>
                        <CardDescription>Analyze your story for strengths and weaknesses. You can edit these suggestions directly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isFetchingFeedback ? <Loader text="Analyzing..." /> : feedback && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="overallAssessment">Overall Assessment</Label>
                                    <Textarea
                                        id="overallAssessment"
                                        value={feedback.overallAssessment}
                                        onChange={(e) => handleFeedbackChange('overallAssessment', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Positive Points</Label>
                                        {feedback.positivePoints.map((point, index) => (
                                            <Input
                                                key={`pos-${index}`}
                                                value={point}
                                                onChange={(e) => handleFeedbackChange('positivePoints', e.target.value, index)}
                                            />
                                        ))}
                                    </div>
                                     <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Areas for Improvement</Label>
                                        {feedback.areasForImprovement.map((point, index) => (
                                            <Input
                                                key={`imp-${index}`}
                                                value={point}
                                                onChange={(e) => handleFeedbackChange('areasForImprovement', e.target.value, index)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default StoryViewPage;