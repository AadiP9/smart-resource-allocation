import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { socket } from '../utils/socket';
import { Activity, Users, AlertTriangle, Brain, Zap } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ volunteers: 42, activeTasks: 0, criticalTasks: 0 });
  const [feed, setFeed] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchData();

    // Phase 3: named socket events
    socket.on('new_report', (report) => {
      setReports((prev) => [report, ...prev]);
      addFeedItem({
        type: 'report',
        msg: `🚨 CRITICAL: ${report.processed_type.toUpperCase()} need detected`,
        id: Date.now(),
      });
    });

    socket.on('task_created', (task) => {
      setTasks((prev) => {
        const next = [task, ...prev];
        updateStats(next);
        return next;
      });
      addFeedItem({ type: 'task', msg: `📋 Task created: ${task.title}`, id: Date.now() });
    });

    // mission_accepted → map marker goes Yellow
    socket.on('mission_accepted', (updatedTask) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t._id === updatedTask._id ? updatedTask : t));
        updateStats(next);
        return next;
      });
      const name = updatedTask.assigned_volunteer?.name || 'a volunteer';
      addFeedItem({
        type: 'task',
        msg: `⚡ Mission accepted by ${name}: ${updatedTask.title}`,
        id: Date.now(),
      });
    });

    // mission_completed → map marker goes Green / task removed from active
    socket.on('mission_completed', (updatedTask) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t._id === updatedTask._id ? updatedTask : t));
        updateStats(next);
        return next;
      });
      addFeedItem({ type: 'success', msg: `✅ Mission complete: ${updatedTask.title}`, id: Date.now() });
    });

    return () => {
      socket.off('new_report');
      socket.off('task_created');
      socket.off('mission_accepted');
      socket.off('mission_completed');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [rRes, tRes] = await Promise.all([
        axios.get(`${API_URL}/reports`),
        axios.get(`${API_URL}/tasks`),
      ]);
      setReports(rRes.data);
      setTasks(tRes.data);
      updateStats(tRes.data);
    } catch (e) {
      console.error('[AdminDashboard] fetchData error:', e);
    }
  };

  const updateStats = (currentTasks) => {
    const active = currentTasks.filter((t) => t.status !== 'completed').length;
    const critical = currentTasks.filter((t) => t.priority >= 70 && t.status !== 'completed').length;
    setStats((prev) => ({ ...prev, activeTasks: active, criticalTasks: critical }));
  };

  const addFeedItem = (item) => {
    setFeed((prev) => [item, ...prev].slice(0, 8));
  };

  const triggerSimulation = async () => {
    setIsSimulating(true);
    addFeedItem({ type: 'system', msg: '⚙️ AI SYSTEM SIMULATION TRIGGERED', id: Date.now() });
    try {
      await axios.post(`${API_URL}/reports/simulate`);
    } catch (err) {
      console.error('[AdminDashboard] simulation error:', err);
    }
    setTimeout(() => setIsSimulating(false), 3000);
  };

  // Colour is based on task STATUS (Phase 3 requirement):
  //   pending   → rose   (red)
  //   accepted  → orange (yellow)
  //   completed → emerald (green)
  // For reports (which have urgency scores, no status), use score-based colour
  const getUrgencyColor = (score) => {
    if (score >= 70) return '#f43f5e';
    if (score >= 40) return '#f97316';
    return '#3b82f6';
  };

  const getTaskColor = (task) => {
    if (task.status === 'completed') return '#22c55e';      // green
    if (task.status === 'accepted' || task.status === 'in_progress') return '#f97316'; // orange
    return getUrgencyColor(task.priority);                   // red/orange/blue
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6 text-slate-200">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Status Overview</h1>
          <p className="text-slate-400 mt-1">Live AI Monitoring &amp; Resource Allocation</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={triggerSimulation}
          disabled={isSimulating}
          className="bg-rose-500/10 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold py-2.5 px-6 rounded-lg flex items-center shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
        >
          <Zap className="w-5 h-5 mr-2" />
          {isSimulating ? 'INJECTING DATA...' : 'SIMULATE CRISIS'}
        </motion.button>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Volunteers" value={stats.volunteers} icon={Users} color="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" />
        <MetricCard title="Active Tasks" value={stats.activeTasks} icon={Activity} color="text-orange-400" bgColor="bg-orange-500/10" borderColor="border-orange-500/20" />
        <MetricCard title="Critical Zones" value={stats.criticalTasks} icon={AlertTriangle} color="text-rose-400" bgColor="bg-rose-500/10" borderColor="border-rose-500/20" animatePulse={stats.criticalTasks > 0} />
        <MetricCard title="Avg Response (est)" value="4.2m" icon={Zap} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-[#121B2B] rounded-2xl border border-slate-800 overflow-hidden relative shadow-xl h-[550px] z-0">
          <div className="absolute top-4 left-4 z-[1000] bg-[#0B1120]/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-3 shadow-lg">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /><span className="text-xs font-semibold text-slate-300">Pending</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /><span className="text-xs font-semibold text-slate-300">Active</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" /><span className="text-xs font-semibold text-slate-300">Done</span></div>
          </div>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full bg-[#0B1120]">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
            {/* Reports as background heatmap circles */}
            {reports.map((report) => (
              <CircleMarker
                key={`r-${report._id}`}
                center={[report.location.coordinates[1], report.location.coordinates[0]]}
                radius={Math.max(8, report.urgency_score / 4)}
                pathOptions={{ fillColor: getUrgencyColor(report.urgency_score), color: getUrgencyColor(report.urgency_score), weight: 1, fillOpacity: 0.35 }}
              />
            ))}
            {/* Tasks as status-coloured interactive markers */}
            {tasks.map((task) => (
              <CircleMarker
                key={`t-${task._id}`}
                center={[task.location.coordinates[1], task.location.coordinates[0]]}
                radius={Math.max(6, task.priority / 6)}
                pathOptions={{ fillColor: getTaskColor(task), color: getTaskColor(task), weight: 2, fillOpacity: 0.7 }}
              >
                <Popup>
                  <div className="p-1">
                    <strong className="text-slate-800 uppercase text-xs font-bold tracking-wider">{task.type} TASK</strong><br />
                    <span className="text-slate-600 text-sm">Priority: <span className="font-bold text-rose-600">{task.priority}</span></span><br />
                    <span className="text-slate-600 text-sm capitalize">Status: {task.status}</span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6 h-[550px]">
          {/* AI Insights */}
          <div className="bg-[#121B2B] rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-slate-800 bg-blue-500/5">
              <h2 className="text-sm font-bold text-blue-400 flex items-center tracking-wider uppercase">
                <Brain className="w-4 h-4 mr-2" /> Predictive AI Insights
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <InsightRow title="Medical Shortage Predicted" desc="82% probability of medical kit shortage in Central Sector within 4 hours based on report clustering." level="critical" />
              <InsightRow title="Resource Allocation Optimal" desc="Volunteer distribution matches current hazard hotspots." level="info" />
            </div>
          </div>

          {/* Live feed */}
          <div className="bg-[#121B2B] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">Live System Feed</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden">
              <AnimatePresence>
                {feed.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    className="mb-3"
                  >
                    <div className={clsx(
                      'text-xs p-3 rounded-lg border backdrop-blur-sm',
                      item.type === 'report'  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                      item.type === 'task'    ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                      item.type === 'system'  ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' :
                                               'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    )}>
                      {item.msg}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {feed.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Awaiting system events...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bgColor, borderColor, animatePulse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('p-5 rounded-2xl border flex items-center justify-between bg-[#121B2B]', bgColor, borderColor)}
    >
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={clsx('text-3xl font-black mt-2', color)}>{value}</p>
      </div>
      <div className={clsx('p-3 rounded-xl', bgColor, color, animatePulse && 'animate-pulse')}>
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
  );
}

function InsightRow({ title, desc, level }) {
  return (
    <div className="flex gap-3 items-start">
      <div className={clsx('mt-0.5 rounded-full p-1', level === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400')}>
        {level === 'critical' ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
      </div>
      <div>
        <h3 className={clsx('text-sm font-bold', level === 'critical' ? 'text-rose-400' : 'text-slate-300')}>{title}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
