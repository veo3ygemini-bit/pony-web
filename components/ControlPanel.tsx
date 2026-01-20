import { useState } from 'react';
import { Sliders, Sparkles, Image as ImageIcon, History, Wand2 } from 'lucide-react';

interface ControlPanelProps {
    promptPos: string;
    setPromptPos: (v: string) => void;
    promptNeg: string;
    setPromptNeg: (v: string) => void;
    cfg: number;
    setCfg: (v: number) => void;
    steps: number;
    setSteps: (v: number) => void;
    denoise: number;
    setDenoise: (v: number) => void;
    seed: number;
    setSeed: (v: number) => void;
    invertMask: boolean;
    setInvertMask: (v: boolean) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export function ControlPanel({
    promptPos, setPromptPos,
    promptNeg, setPromptNeg,
    cfg, setCfg,
    steps, setSteps,
    denoise, setDenoise,
    seed, setSeed,
    invertMask, setInvertMask,
    onGenerate, isGenerating
}: ControlPanelProps) {

    const [activeTab, setActiveTab] = useState<'create' | 'settings'>('create');

    const presets = [
        { name: 'Realistic', icon: '📸', pos: 'photorealistic, detailed skin, 8k, best quality', neg: 'cartoon, painting, anime, ugly' },
        { name: 'Anime', icon: '🌸', pos: 'anime style, vibrant colors, studio ghibli, 4k', neg: 'photorealistic, 3d, ugly' },
        { name: '3D Render', icon: '🧊', pos: '3d render, blender, unreal engine 5, octane render', neg: '2d, sketch, flat' },
        { name: 'Painting', icon: '🎨', pos: 'oil painting, brush strokes, artistic, masterpiece', neg: 'photo, realistic' },
    ];

    const applyPreset = (p: typeof presets[0]) => {
        setPromptPos(p.pos + ", " + promptPos);
        setPromptNeg(p.neg + ", " + promptNeg);
    };

    return (
        <div className="w-80 bg-[#0f1115] border-l border-white/10 flex flex-col h-full text-white">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'create' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sparkles size={16} /> Generate
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sliders size={16} /> Advanced
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                {activeTab === 'create' && (
                    <>
                        {/* Presets */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style Presets</label>
                            <div className="grid grid-cols-2 gap-2">
                                {presets.map(p => (
                                    <button
                                        key={p.name}
                                        onClick={() => applyPreset(p)}
                                        className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-lg p-2 flex items-center gap-2 text-xs transition"
                                    >
                                        <span>{p.icon}</span> {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prompts */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                Positive Prompt <Wand2 size={12} className="text-purple-400" />
                            </label>
                            <textarea
                                value={promptPos}
                                onChange={e => setPromptPos(e.target.value)}
                                className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none placeholder-white/20"
                                placeholder="Describe what you want..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-red-400/80">Negative Prompt</label>
                            <textarea
                                value={promptNeg}
                                onChange={e => setPromptNeg(e.target.value)}
                                className="w-full h-20 bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:ring-1 focus:ring-red-500/50 outline-none resize-none placeholder-white/20"
                                placeholder="What to avoid..."
                            />
                        </div>

                        {/* Denoise Slider (Most Important) */}
                        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Denoising Strength</label>
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">{denoise}</span>
                            </div>
                            <input
                                type="range"
                                min="0.05" max="1.0" step="0.01"
                                value={denoise}
                                onChange={e => setDenoise(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <p className="text-[10px] text-gray-400">
                                <span className="text-white">Lower:</span> Keeps more original. <span className="text-white">Higher:</span> More creative/hallucinated.
                            </p>
                        </div>

                        {/* Invert Mask Toggle */}
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer" onClick={() => setInvertMask(!invertMask)}>
                            <span className="text-sm">Invert Mask</span>
                            <div className={`w-10 h-5 rounded-full relative transition ${invertMask ? 'bg-purple-600' : 'bg-gray-600'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${invertMask ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>

                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>CFG Scale</span> <span>{cfg}</span>
                            </div>
                            <input type="range" min="1" max="25" step="0.5" value={cfg} onChange={e => setCfg(Number(e.target.value))} className="w-full accent-purple-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Steps</span> <span>{steps}</span>
                            </div>
                            <input type="range" min="10" max="50" step="1" value={steps} onChange={e => setSteps(Number(e.target.value))} className="w-full accent-purple-500" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Seed</span> <span>{seed}</span>
                            </div>
                            <div className="flex gap-2">
                                <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))} className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-sm" />
                                <button onClick={() => setSeed(Math.floor(Math.random() * 99999999))} className="p-1 hover:text-purple-400"><History /></button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <div className="p-5 border-t border-white/10 bg-[#0f1115]">
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin">⏳</span> Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} /> Generate
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
