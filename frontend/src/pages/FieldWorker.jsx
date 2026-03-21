import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Tesseract from 'tesseract.js';
import { Camera, Mic, UploadCloud, MapPin, CheckCircle, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export default function FieldWorker() {
  const [inputVal, setInputVal] = useState('');
  const [status, setStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Setup Web Speech API for Voice-to-Text
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
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        setStatus('Voice recognition error.');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSimulateInput = (text) => {
    setInputVal(text);
  };
  
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setStatus('Analyzing Image (OCR)...');
      
      Tesseract.recognize(
        file,
        'eng',
      ).then(({ data: { text } }) => {
        const cleanText = text.trim();
        if (cleanText) {
          setInputVal(prev => prev ? prev + '\n[OCR]: ' + cleanText : '[OCR]: ' + cleanText);
          setStatus('Image Analyzed!');
        } else {
          setStatus('No text found in image.');
        }
        setTimeout(() => setStatus(''), 3000);
      }).catch(err => {
        console.error(err);
        setStatus('OCR Failed');
      });
    }
  };

  const handleRecordVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser (Try Chrome or Edge).');
      return;
    }
    
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
    setStatus('Submitting...');
    
    // Simulate real GPS coordinates for demo (random near central India)
    const lat = 20.0 + Math.random() * 5 - 2.5;
    const lng = 78.0 + Math.random() * 5 - 2.5;

    try {
      await axios.post(`${API_URL}/reports`, {
        raw_input: inputVal,
        location: { lat, lng }
      });
      setStatus('Success!');
      setInputVal('');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('Error submitting report.');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto w-full pt-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Field Report</h2>
          <p className="text-blue-100 mt-1 text-sm">Submit community needs</p>
        </div>
        
        <div className="p-6 space-y-6">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
          <div className="flex justify-between gap-4">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs font-medium text-gray-600">Scan Image</span>
            </button>
            <button 
              type="button"
              onClick={handleRecordVoice}
              disabled={isRecording}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition ${isRecording ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'}`}
            >
              <Mic className={`w-8 h-8 mb-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              <span className={`text-xs font-medium ${isRecording ? 'text-red-600' : 'text-gray-600'}`}>
                {isRecording ? 'Recording...' : 'Record Voice'}
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block tracking-wide text-gray-700 text-sm font-semibold mb-2" htmlFor="raw-input">
                  Details / AI Raw Input
                </label>
                <textarea 
                  id="raw-input"
                  className="appearance-none block w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-lg py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-blue-500 h-32 resize-none" 
                  placeholder="Describe the situation or use the scanners above..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  required
                />
             </div>
             
             <div className="flex items-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
               <MapPin className="w-5 h-5 mr-2 text-green-500" />
               Location will be auto-attached (GPS Data)
             </div>

             <button 
                type="submit" 
                disabled={!inputVal || status === 'Submitting...'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
              >
                {status === 'Success!' ? <CheckCircle className="w-6 h-6 mr-2" /> : <UploadCloud className="w-6 h-6 mr-2" />}
                {status || 'Submit Report'}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
}
