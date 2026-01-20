import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Eraser, Brush, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface CanvasEditorProps {
    imageFile: File | null;
    brushSize: number;
    isEraser: boolean; // Toggle between "Masking" (making transparent) and "Restoring" (if we had functionality)
    // Actually simplest for now: "Brush" = Erase (make transparent/mask).
    onMaskChange: (hasMask: boolean) => void;
}

export interface CanvasEditorRef {
    getCanvasData: () => string | null;
    reset: () => void;
}

export const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(({ imageFile, brushSize, onMaskChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState<'draw' | 'pan'>('draw');

    useImperativeHandle(ref, () => ({
        getCanvasData: () => canvasRef.current?.toDataURL('image/png') || null,
        reset: () => resetCanvas()
    }));

    useEffect(() => {
        if (imageFile) {
            const img = new Image();
            img.onload = () => {
                setImgObj(img);
                resetCanvas(img);
            };
            img.src = URL.createObjectURL(imageFile);
        }
    }, [imageFile]);

    const resetCanvas = (img = imgObj) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && img) {
            // Fit image to max 1024x1024 or keep aspect ratio?
            // Let's keep original size but limit display
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Reset view
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode === 'pan') return; // Handled by container scroll or custom pan logic
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        ctx?.beginPath();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || mode === 'pan') return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Calculate coordinates considering zoom/pan would be hard on standard event
        // Simplified: We assume canvas is scaled by CSS transform, so we need to map client coordinates
        // back to canvas coordinates.

        // Get client pos
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        // Logic: Inpainting usually treats TRANSPARENCY as the mask.
        // So "Brushing" should ENABLE transparency (Erase logic).
        ctx.globalCompositeOperation = 'destination-out';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);

        onMaskChange(true);
    };

    // Pan Logic interactions could be complex, simple version: 
    // Container overflow: hidden, Canvas has transform.

    return (
        <div className="relative w-full h-full bg-[#0f1115] overflow-hidden flex flex-col">
            {/* Toolbar floating inside */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 border border-white/10 shadow-xl">
                <button
                    onClick={() => setMode('draw')}
                    className={`p-2 rounded-full transition ${mode === 'draw' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Brush (Create Mask)"
                >
                    <Brush size={20} />
                </button>
                <button
                    onClick={() => setMode('pan')}
                    className={`p-2 rounded-full transition ${mode === 'pan' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Pan Tool"
                >
                    <Move size={20} />
                </button>
                <div className="w-px bg-white/10 mx-1" />
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="text-gray-400 hover:text-white"><ZoomOut size={20} /></button>
                <span className="text-xs text-gray-400 font-mono self-center w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="text-gray-400 hover:text-white"><ZoomIn size={20} /></button>
                <div className="w-px bg-white/10 mx-1" />
                <button onClick={() => resetCanvas()} className="text-gray-400 hover:text-red-400" title="Reset Mask"><RotateCcw size={20} /></button>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className={`flex-1 flex items-center justify-center overflow-auto cursor-${mode === 'pan' ? 'grab' : 'crosshair'}`}
            // For real pan, we would need onMouseDown here handling scrollLeft/Top
            >
                {imgObj ? (
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.1s ease-out',
                            background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2nk5OeZhLMZ8x8ZQB1kY2Njs2FkYGRkZCQbM0FcgwE5G4xhMCacjcZkAAwYAN002D3WAAAAAElFTkSuQmCC) repeat',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}
                    />
                ) : (
                    <div className="text-gray-500 flex flex-col items-center animate-pulse">
                        <p>No image loaded</p>
                    </div>
                )}
            </div>
        </div>
    );
});

CanvasEditor.displayName = "CanvasEditor";
