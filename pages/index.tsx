'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [promptPos, setPromptPos] = useState('young woman, erotic, nude');
  const [promptNeg, setPromptNeg] = useState('blurry, lowres, bad quality');
  const [seed, setSeed] = useState(42);
  const [steps, setSteps] = useState(10);
  const [cfg, setCfg] = useState(7.0);
  const [denoise, setDenoise] = useState(0.73);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string>('');
  const [error, setError] = useState('');

  const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || 'https://[tu-usuario]-pony-inpainting.hf.space';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagen(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imagen) { setError('Sube imagen'); return; }
    if (!promptPos) { setError('Escribe prompt'); return; }

    setLoading(true);
    setError('');
    setResultado('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

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
      };
      reader.readAsDataURL(imagen);

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
        <p className="text-gray-400 mb-8">Modifica imágenes con IA 100% gratis</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-purple-500 rounded-lg p-8 cursor-pointer hover:border-purple-400 transition text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-auto rounded-lg" />
              ) : (
                <div>
                  <p className="text-gray-400">📸 Click o arrastra</p>
                  <p className="text-gray-500 text-sm">PNG, JPG, WebP</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <textarea
              value={promptPos}
              onChange={(e) => setPromptPos(e.target.value)}
              placeholder="Qué generar..."
              className="w-full h-24 bg-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none border border-slate-600"
            />

            <textarea
              value={promptNeg}
              onChange={(e) => setPromptNeg(e.target.value)}
              className="w-full h-20 bg-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none border border-slate-600"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Seed: {seed}</label>
              <input type="range" min="0" max="999999" value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="w-full" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Steps: {steps}</label>
              <input type="range" min="1" max="30" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full" />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !imagen || !promptPos}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? '⏳ Generando...' : '✨ Generar'}
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
                El resultado aquí
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>⏱️ 30-60s por generación | 🔒 100% gratuito</p>
        </div>
      </div>
    </div>
  );
}
