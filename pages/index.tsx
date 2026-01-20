import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { CanvasEditor, CanvasEditorRef } from '../components/CanvasEditor';
import { ControlPanel } from '../components/ControlPanel';
import { Upload, Download, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Generation Params
  const [promptPos, setPromptPos] = useState('young woman, erotic, nude');
  const [promptNeg, setPromptNeg] = useState('blurry, lowres, bad quality, watermark, text');
  const [cfg, setCfg] = useState(7.0);
  const [steps, setSteps] = useState(10); // Default low for speed
  const [denoise, setDenoise] = useState(0.73); // Good default for inpaint
  const [seed, setSeed] = useState(42);
  const [invertMask, setInvertMask] = useState(false);

  const canvasRef = useRef<CanvasEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const HF_SPACE_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setResultImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) { setError("Please upload an image first."); return; }

    // Get image data from Canvas (which includes the transparency mask)
    const base64Data = canvasRef.current?.getCanvasData();
    if (!base64Data) { setError("Could not get image data."); return; }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${HF_SPACE_URL}/run/generar_imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { data: base64Data },
          promptPos,
          promptNeg,
          seed,
          steps,
          cfg,
          denoise,
          invertMask // Sending new param
        ])
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      // Gradio API returns: { data: [ "data:image/png;base64,..." ] }
      if (data && data.data && data.data[0]) {
        setResultImage(data.data[0]);
      } else {
        throw new Error("No image returned from server.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex overflow-hidden font-sans selection:bg-purple-500/30">
      <Head>
        <title>Pony Studio | Professional Inpainting</title>
      </Head>

      {/* Left Side: Toolbar / Upload is inside Panel or floating? 
            Let's keep Upload separate or inside CanvasEditor?
            Actually, let's put a Top Bar or Overlay for upload.
        */}

      <div className="flex-1 flex flex-col relative">
        {/* Header / Top Bar */}
        <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-[#0f1115]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-bold">P</div>
            <span className="font-bold tracking-tight">Pony Studio</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">Beta</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
            >
              <Upload size={16} /> Upload Image
            </button>
            {resultImage && (
              <a
                href={resultImage}
                download={`pony-edit-${Date.now()}.png`}
                className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg transition"
              >
                <Download size={16} /> Download
              </a>
            )}
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 relative bg-[#050505]">
          {/* Error Toast */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl backdrop-blur">
              <AlertCircle size={16} /> {error}
              <button onClick={() => setError('')} className="ml-2 hover:bg-black/20 rounded p-1">✕</button>
            </div>
          )}

          {!imageFile ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-96 h-64 border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition bg-white/5 hover:bg-white/10 group"
              >
                <Upload size={48} className="mb-4 text-gray-600 group-hover:text-purple-400 transition" />
                <p className="font-medium text-gray-300">Drop an image here</p>
                <p className="text-sm">or click to upload</p>
              </div>
            </div>
          ) : (
            <>
              {/* If we have a result, we show "Compare" mode or just overlay Result? 
                           Let's show Result on top of Original?
                           Or side by side? 
                           "Studio" usually shows the working canvas. 
                           Result replaces the image?
                           Let's implement a simple "Toggle View" if result exists.
                       */}

              {resultImage ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  {/* Result View with Compare Slider Idea would be complex to implement properly in one go.
                                 Simple version: Show Result.
                             */}
                  <div className="relative h-full w-full flex items-center justify-center">
                    <img
                      src={resultImage}
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                      alt="Result"
                    />
                    <button
                      onClick={() => setResultImage(null)}
                      className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur border border-white/10 hover:bg-purple-600"
                    >
                      Back to Editor
                    </button>
                  </div>
                </div>
              ) : (
                <CanvasEditor
                  ref={canvasRef}
                  imageFile={imageFile}
                  brushSize={30}
                  isEraser={true}
                  onMaskChange={() => { }}
                />
              )}
            </>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Right Sidebar: Controls */}
      <ControlPanel
        promptPos={promptPos} setPromptPos={setPromptPos}
        promptNeg={promptNeg} setPromptNeg={setPromptNeg}
        cfg={cfg} setCfg={setCfg}
        steps={steps} setSteps={setSteps}
        denoise={denoise} setDenoise={setDenoise}
        seed={seed} setSeed={setSeed}
        invertMask={invertMask} setInvertMask={setInvertMask}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </div>
  );
}
