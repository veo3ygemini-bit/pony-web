'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [promptPos, setPromptPos] = useState('young woman, erotic, nude');
  const [promptNeg, setPromptNeg] = useState('blurry, lowres, bad quality');
  const [seed, setSeed] = useState(42);
  const [steps, setSteps] = useState(10);
  const [cfg, setCfg] = useState(7.0);
  const [denoise, setDenoise] = useState(0.73);
  const [brushSize, setBrushSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string>('');
  const [error, setError] = useState('');
  const [hasImage, setHasImage] = useState(false);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || 'https://[tu-usuario]-pony-inpainting.hf.space';

  // Initialize/Reset Canvas when image loads
  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && imgRef.current) {
      canvas.width = imgRef.current.width;
      canvas.height = imgRef.current.height;
      ctx.drawImage(imgRef.current, 0, 0);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setHasImage(true);
        // Pequeño delay para asegurar que el canvas está renderizado
        setTimeout(resetCanvas, 100);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.globalCompositeOperation = 'destination-out'; // ERASER mode (make transparent)

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleGenerate = async () => {
    if (!hasImage) { setError('Sube imagen'); return; }
    if (!promptPos) { setError('Escribe prompt'); return; }

    setLoading(true);
    setError('');
    setResultado('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("No canvas");

      // Get Data URL (creates RGBA PNG with transparent "hole" where masked)
      const base64 = canvas.toDataURL('image/png');

      const response = await fetch(`${HF_SPACE_URL}/run/generar_imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { data: base64 },
          promptPos,
          promptNeg,
          seed,
          steps,
          cfg,
          denoise
        ])
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.data && data.data[0]) {
        if (typeof data.data[0] === 'string' && data.data[0].startsWith('data:')) {
          setResultado(data.data[0]);
        }
      }

      setError('✅ Completado');

    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🎨 Pony Inpainting</h1>
        <p className="text-gray-400 mb-8">Pinta el área que quieres modificar (se volverá transparente)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">

            {/* Editor Container */}
            <div className="relative border-2 border-dashed border-purple-500 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center min-h-[300px]">
              {!hasImage ? (
                <div
                  className="text-center cursor-pointer p-8 w-full h-full flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-gray-400 text-xl">📸 Sube una imagen</p>
                  <p className="text-gray-500 text-sm mt-2">Click aquí</p>
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseOut={stopDrawing}
                  onMouseMove={draw}
                  className="max-w-full max-h-[500px] cursor-crosshair touch-none"
                  style={{ background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2nk5OeZhLMZ8x8ZQB1kY2Njs2FkYGRkZCQbM0FcgwE5G4xhMCacjcZkAAwYAN002D3WAAAAAElFTkSuQmCC) repeat' }} // Checkerboard pattern for transparency
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {hasImage && (
              <div className="flex gap-4 items-center bg-slate-800 p-3 rounded-lg">
                <span className="text-white text-sm">🖌️ Tamaño:</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-32"
                />
                <button
                  onClick={resetCanvas}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition ml-auto"
                >
                  🗑️ Borrar Máscara
                </button>
              </div>
            )}

            <textarea
              value={promptPos}
              onChange={(e) => setPromptPos(e.target.value)}
              placeholder="Qué generar (ej: cat wizard)..."
              className="w-full h-24 bg-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none border border-slate-600"
            />

            <textarea
              value={promptNeg}
              onChange={(e) => setPromptNeg(e.target.value)}
              placeholder="Prompt Negativo..."
              className="w-full h-20 bg-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none border border-slate-600"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">CFG Scale: {cfg}</label>
              <input type="range" min="1" max="20" step="0.5" value={cfg} onChange={(e) => setCfg(Number(e.target.value))} className="w-full" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Denoising Strength: {denoise}</label>
              <input type="range" min="0" max="1" step="0.05" value={denoise} onChange={(e) => setDenoise(Number(e.target.value))} className="w-full" />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !hasImage}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? '⏳ Generando (30-60s)...' : '✨ Generar Imagen'}
            </button>

            {error && (
              <div className={`p-4 rounded-lg ${error.includes('✅') ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                <p className={error.includes('✅') ? 'text-green-300' : 'text-red-300'}>{error}</p>
              </div>
            )}
          </div>

          <div>
            {resultado ? (
              <img src={resultado} alt="Resultado" className="w-full rounded-lg shadow-xl" />
            ) : (
              <div className="w-full h-96 bg-slate-700 rounded-lg flex items-center justify-center text-gray-500">
                El resultado aparecerá aquí
              </div>
            )}
            <div className="mt-4 text-xs text-center text-gray-500">
              Usa el pincel para borrar el área que quieres que la IA regenere.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
