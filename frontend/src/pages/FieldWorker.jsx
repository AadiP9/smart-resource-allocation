import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Camera, Mic, UploadCloud, MapPin, CheckCircle, Brain, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function FieldWorker() {
  const [inputVal, setInputVal] = useState('');
  const [status, setStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(prev => prev ? prev + ' ' + transcript : transcript);
        setIsRecording(false);
        setStatus('Voice captured!');
        setTimeout(() => setStatus(''), 3000);
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsRecording(false);
        setStatus('Voice recognition error.');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setStatus('Analyzing Image (OCR)...');
      
      Tesseract.recognize(file, 'eng')
        .then(({ data: { text } }) => {
          const cleanText = text.trim();
          if (cleanText) setInputVal(prev => prev ? prev + '\n[OCR]: ' + cleanText : '[OCR]: ' + cleanText);
          setStatus('Image Analyzed!');
          setTimeout(() => setStatus(''), 3000);
        }).catch(() => setStatus('OCR Failed'));
    }
  };

  const handleRecordVoice = () => {
    if (!recognitionRef.current) return alert('Speech recognition is not supported in this browser.');
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setStatus('');
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      setStatus('Listening...');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting & Processing AI...');
    setReportResult(null); // reset
    
    const lat = 20.0 + Math.random() * 5 - 2.5;
    const lng = 78.0 + Math.random() * 5 - 2.5;

    try {
      const res = await axios.post(`${API_URL}/reports`, {
        raw_input: inputVal,
        location: { lat, lng }
      });
      
      setReportResult({
        type: res.data.report.processed_type.toUpperCase(),
        urgency: res.data.report.urgency_score,
        task: res.data.task.title
      });
      
      setStatus('Success!');
      setInputVal('');
      setTimeout(() => setStatus(''), 5000);
    } catch (err) {
      setStatus('Error submitting report.');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto w-full pt-10 min-h-[calc(100vh-64px)] bg-[#0B1120] text-slate-200">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#121B2B] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 z-10"></div>
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <Radio className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase">Field Link</h2>
              <p className="text-slate-400 text-xs tracking-wider">Secure Data Ingestion Port</p>
            </div>
          </div>
          
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          
          {/* Smart Input Controls */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-700 bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
            >
              <Camera className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Visual Scan</span>
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleRecordVoice}
              className={clsx(
                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-colors",
                isRecording ? "border-rose-500 bg-rose-500/10" : "border-slate-700 bg-slate-800/50 hover:border-purple-500/50 hover:bg-purple-500/10"
              )}
            >
              <Mic className={clsx("w-8 h-8 mb-2", isRecording ? "text-rose-500 animate-pulse" : "text-purple-400")} />
              <span className={clsx("text-xs font-bold uppercase tracking-wider", isRecording ? "text-rose-500 animate-pulse" : "text-slate-300")}>
                {isRecording ? 'Listening...' : 'Comms Link'}
              </span>
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label className="block tracking-wider uppercase text-slate-400 text-xs font-bold mb-3 flex justify-between">
                  <span>Raw Data Stream</span>
                  {status && <span className="text-blue-400 animate-pulse">{status}</span>}
                </label>
                <textarea 
                  className="w-full bg-[#0B1120] text-slate-200 border border-slate-700 rounded-xl py-4 px-5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32 resize-none transition-all placeholder-slate-600" 
                  placeholder="Awaiting input from Visual Scan or Comms Link..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  required
                />
             </div>
             
             <button 
                type="submit" 
                disabled={!inputVal || status === 'Submitting & Processing AI...'}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center disabled:opacity-50 disabled:shadow-none uppercase tracking-widest text-sm"
              >
                {status === 'Success!' ? <CheckCircle className="w-5 h-5 mr-3" /> : <UploadCloud className="w-5 h-5 mr-3" />}
                {status || 'Transmit to HQ'}
             </button>
          </form>

          {/* AI Output Feedback Area */}
          <AnimatePresence>
            {reportResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">AI Output Confirmed</h3>
                </div>
                <div className="space-y-2 text-sm text-emerald-200/80">
                  <p><span className="font-bold text-emerald-300">Detected Need:</span> {reportResult.type}</p>
                  <p><span className="font-bold text-rose-400">Urgency Score:</span> {reportResult.urgency}/100</p>
                  <p><span className="font-bold text-emerald-300">Action:</span> {reportResult.task} deployed to Network.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
