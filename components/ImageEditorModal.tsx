import React, { useState, useRef } from 'react';
import { Panel } from '../types';
import { useMangaStore } from '../src/state/mangaStore';
import { useParams } from 'react-router-dom';
import { googleAIController } from '../services/aiController';
import Modal from './ui/Modal';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import toast from 'react-hot-toast';
import { Wand2, XCircle } from 'lucide-react';
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
    
    // State for region selection
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
    const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const numChapter = parseInt(chapterNumber!, 10);
    const numPage = parseInt(pageNumber!, 10);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({ x, y });
        setSelection(null);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!startPoint || !imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        setSelection({
            x: Math.min(startPoint.x, currentX),
            y: Math.min(startPoint.y, currentY),
            width: Math.abs(currentX - startPoint.x),
            height: Math.abs(currentY - startPoint.y)
        });
    };

    const handleMouseUp = () => {
        setStartPoint(null);
    };


    const handleEditImage = async () => {
        if (!prompt.trim() || !panel.imageUrl) return;

        setIsEditing(true);
        const toastId = toast.loading("AI is editing the image...");

        let finalPrompt = prompt;
        if (selection && imageContainerRef.current) {
            const { clientWidth, clientHeight } = imageContainerRef.current;
            if (clientWidth > 0 && clientHeight > 0 && selection.width > 5 && selection.height > 5) { // Ignore tiny selections
                const xPercent = (selection.x / clientWidth * 100).toFixed(1);
                const yPercent = (selection.y / clientHeight * 100).toFixed(1);
                const wPercent = (selection.width / clientWidth * 100).toFixed(1);
                const hPercent = (selection.height / clientHeight * 100).toFixed(1);

                finalPrompt = `Apply the following edit ONLY within the rectangular region defined by the top-left corner at (top: ${yPercent}%, left: ${xPercent}%) and with dimensions (width: ${wPercent}%, height: ${hPercent}%). The edit is: "${prompt}". Do not alter any part of the image outside of this specified region.`;
            }
        }

        try {
            const result = await googleAIController('edit_panel_image', {
                base64ImageData: panel.imageUrl,
                mimeType: 'image/jpeg', // Assuming jpeg from generation
                prompt: finalPrompt,
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
        handleClose();
    };
    
    const handleClose = () => {
        setPrompt('');
        setEditedImageUrl(null);
        setSelection(null);
        setStartPoint(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Panel Image with AI">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Original Image <span className="text-xs text-slate-400 font-normal">(Click and drag to select a region)</span></Label>
                        <div
                            ref={imageContainerRef}
                            className="relative cursor-crosshair rounded-md border border-slate-700 overflow-hidden"
                            onMouseDown={handleMouseDown}
                            onMouseMove={startPoint ? handleMouseMove : undefined}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {panel.imageUrl && <img src={`data:image/jpeg;base64,${panel.imageUrl}`} alt="Original Panel" className="w-full h-full object-contain" />}
                            {selection && (
                                <div
                                    className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/20 pointer-events-none"
                                    style={{
                                        left: `${selection.x}px`,
                                        top: `${selection.y}px`,
                                        width: `${selection.width}px`,
                                        height: `${selection.height}px`,
                                    }}
                                />
                            )}
                        </div>
                        {selection && (
                           <Button onClick={() => setSelection(null)} variant="link" size="sm" className="mt-1 text-red-400">
                               <XCircle className="mr-1 h-3 w-3"/> Clear Selection
                           </Button>
                        )}
                    </div>
                     <div>
                        <Label>Edited Image</Label>
                        <div className="h-full rounded-md border border-slate-700 bg-slate-800/50 flex items-center justify-center">
                            {isEditing ? <Loader text="Editing..." /> :
                                editedImageUrl ? <img src={editedImageUrl} alt="Edited Panel" className="rounded-md w-full h-full object-contain" /> :
                                <p className="text-sm text-slate-500 p-4 text-center">New image will appear here</p>
                            }
                        </div>
                    </div>
                </div>
                <div>
                    <Label htmlFor="edit-prompt">{selection ? `What do you want to change in the selected region?` : `What do you want to change in the image?`}</Label>
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
