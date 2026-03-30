import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../utils/socket';
import { MapPin, Navigation, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function VolunteerApp() {
  const [tasks, setTasks] = useState([]);
  const myLat = 20.0;
  const myLng = 78.0;

  useEffect(() => {
    fetchTasks();
    socket.on('new_task', () => fetchTasks());
    socket.on('task_updated', () => fetchTasks());

    return () => {
      socket.off('new_task');
      socket.off('task_updated');
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data.filter(t => t.status !== 'completed'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (id, newStatus) => {
    try {
      await axios.post(`${API_URL}/tasks/${id}/status`, {
        status: newStatus,
        volunteer_id: '60d0fe4f5311236168a109ca'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getDistance = (lat, lng) => {
    const dLat = (lat - myLat) * 111;
    const dLng = (lng - myLng) * 111;
    return Math.sqrt(dLat*dLat + dLng*dLng).toFixed(1);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0B1120] text-slate-200 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-widest uppercase">Volunteer Unit</h1>
            <p className="text-slate-400 text-sm mt-1">Live Action Assignments</p>
          </div>
        </header>

        <div className="space-y-4">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div 
                key={task._id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#121B2B] rounded-2xl border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative"
              >
                {/* Priority Glow Border Top/Left */}
                <div className={clsx(
                  "h-1 md:h-auto md:w-2",
                  task.priority >= 70 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 
                  task.priority >= 40 ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'
                )}></div>
                
                <div className="p-6 md:p-8 flex-1 relative">
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Priority</span>
                    <span className={clsx(
                      "text-sm font-black px-3 py-1 rounded-full",
                      task.priority >= 70 ? 'bg-rose-500/20 text-rose-400' : 
                      task.priority >= 40 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {task.priority}/100
                    </span>
                  </div>
                  
                  <h3 className="font-black text-2xl text-white pr-24 leading-tight tracking-wide">{task.title}</h3>
                  
                  <div className="flex flex-wrap items-center mt-4 gap-4">
                    <div className="flex items-center text-sm font-semibold text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500"/> 
                      {getDistance(task.location.lat, task.location.lng)} km AWY
                    </div>
                    <span className="uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                      {task.type}
                    </span>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    {task.status === 'pending' && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction(task._id, 'accepted')}
                        className="flex-1 bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-[background] flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                      >
                        Accept Mission
                      </motion.button>
                    )}
                    {task.status === 'accepted' && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction(task._id, 'in_progress')}
                        className="flex-1 bg-orange-500 border border-orange-400 hover:bg-orange-400 text-white py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-[background] flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                      >
                        <Navigation className="w-5 h-5 mr-3" /> Start Route
                      </motion.button>
                    )}
                    {task.status === 'in_progress' && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction(task._id, 'completed')}
                        className="flex-1 bg-emerald-500 border border-emerald-400 hover:bg-emerald-400 text-white py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-[background] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-3" /> Complete Mission
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <CheckCircle2 className="w-20 h-20 text-slate-700 mx-auto mb-6" />
              <p className="text-slate-400 text-lg font-bold tracking-widest uppercase">Standby Mode</p>
              <p className="text-slate-500 text-sm mt-2">No active missions in your sector.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
