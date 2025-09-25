import React, { useState } from 'react';
import { Panel } from '../types';
import { useMangaStore } from '../src/state/mangaStore';
import { useParams } from 'react-router-dom';
import { googleAIController } from '../services/aiController';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import toast from 'react-hot-toast';
import { Wand2 } from 'lucide-react';
import Loader from './Loader';

interface ImageEditorModalProps {
    panel: Panel;
    isOpen: boolean;
    onClose: () => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ panel, isOpen, onClose }) => {
    const { updatePanel } = useMangaStore();
    const { chapterNumber, pageNumber } = useParams<{ chapterNumber: string, pageNumber: string }>();
    const [prompt, setPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);

    const numChapter = parseInt(chapterNumber!, 10);
    const numPage = parseInt(pageNumber!, 10);

    const handleEditImage = async () => {
        if (!prompt.trim() || !panel.imageUrl) return;

        setIsEditing(true);
        const toastId = toast.loading("AI is editing the image...");

        try {
            const result = await googleAIController('edit_panel_image', {
                base64ImageData: panel.imageUrl,
                mimeType: 'image/jpeg', // Assuming jpeg from generation
                prompt,
            });

            if (result.base64Image) {
                setEditedImageUrl(`data:image/jpeg;base64,${result.base64Image}`);
                toast.success("Image edited! Review and save.", { id: toastId });
            } else {
                toast.error("The AI did not return a new image.", { id: toastId });
            }

        } catch (e: any) {
            toast.error(`Image editing failed: ${e.message}`, { id: toastId });
        } finally {
            setIsEditing(false);
        }
    };

    const handleSaveImage = async () => {
        if (!editedImageUrl || !panel.imageUrl) return;

        const base64Data = editedImageUrl.split(',')[1];
        const updatedPanel: Panel = {
            ...panel,
            imageUrl: base64Data,
            imageGenerationPrompt: `${panel.imageGenerationPrompt}\n\nEDIT: ${prompt}`
        };
        
        await updatePanel(numChapter, numPage, updatedPanel, true);
        toast.success("New image saved!");
        onClose();
        setEditedImageUrl(null); // Reset for next time
    };
    
    const handleClose = () => {
        setPrompt('');
        setEditedImageUrl(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Panel Image with AI">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Original Image</Label>
                        {panel.imageUrl && <img src={`data:image/jpeg;base64,${panel.imageUrl}`} alt="Original Panel" className="rounded-md border border-slate-700" />}
                    </div>
                     <div>
                        <Label>Edited Image</Label>
                        <div className="h-full rounded-md border border-slate-700 bg-slate-800/50 flex items-center justify-center">
                            {isEditing ? <Loader text="Editing..." /> :
                                editedImageUrl ? <img src={editedImageUrl} alt="Edited Panel" className="rounded-md" /> :
                                <p className="text-sm text-slate-500">New image will appear here</p>
                            }
                        </div>
                    </div>
                </div>
                <div>
                    <Label htmlFor="edit-prompt">What do you want to change?</Label>
                    <Textarea
                        id="edit-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., add a cat on the table, change the character's expression to happy, make it nighttime"
                        rows={3}
                        disabled={isEditing}
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button onClick={handleClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleEditImage} isLoading={isEditing} disabled={!prompt.trim()}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Edit
                    </Button>
                    <Button onClick={handleSaveImage} disabled={!editedImageUrl || isEditing}>
                        Save New Image
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ImageEditorModal;
