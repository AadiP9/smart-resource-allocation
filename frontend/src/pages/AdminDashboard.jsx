import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { socket } from '../utils/socket';
import { Activity, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ volunteers: 42, activeTasks: 0, criticalTasks: 0 });
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    // Initial fetch
    axios.get(`${API_URL}/reports`).then(res => setReports(res.data)).catch(console.error);
    axios.get(`${API_URL}/tasks`).then(res => {
      setTasks(res.data);
      updateStats(res.data);
    }).catch(console.error);

    // Socket listeners
    socket.on('new_report', (report) => {
      setReports(prev => [report, ...prev]);
      addFeedItem(`New urgency ${report.urgency_score} report located at [${report.location.lat.toFixed(2)}, ${report.location.lng.toFixed(2)}]`);
    });

    socket.on('new_task', (task) => {
      setTasks(prev => {
        const next = [task, ...prev];
        updateStats(next);
        return next;
      });
      addFeedItem(`New task created: ${task.title}`);
    });

    socket.on('task_updated', (updatedTask) => {
      setTasks(prev => {
        const next = prev.map(t => t._id === updatedTask._id ? updatedTask : t);
        updateStats(next);
        return next;
      });
      addFeedItem(`Task updated: ${updatedTask.title} is now ${updatedTask.status}`);
    });

    return () => {
      socket.off('new_report');
      socket.off('new_task');
      socket.off('task_updated');
    };
  }, []);

  const updateStats = (currentTasks) => {
    const active = currentTasks.filter(t => t.status !== 'completed').length;
    const critical = currentTasks.filter(t => t.priority >= 70 && t.status !== 'completed').length;
    setStats(prev => ({ ...prev, activeTasks: active, criticalTasks: critical }));
  };

  const addFeedItem = (msg) => {
    setFeed(prev => [{ id: Date.now(), msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
  };

  const getUrgencyColor = (score) => {
    if (score >= 70) return '#ef4444'; // red-500
    if (score >= 40) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Volunteers" value={stats.volunteers} icon={Users} color="text-blue-500" />
        <StatCard title="Active Tasks" value={stats.activeTasks} icon={Activity} color="text-yellow-500" />
        <StatCard title="Critical Tasks" value={stats.criticalTasks} icon={AlertTriangle} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[500px] relative z-0">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            
            {reports.map((report) => (
              <CircleMarker 
                key={report._id}
                center={[report.location.lat, report.location.lng]}
                radius={report.urgency_score / 5 + 5}
                pathOptions={{ 
                  fillColor: getUrgencyColor(report.urgency_score),
                  color: getUrgencyColor(report.urgency_score),
                  fillOpacity: 0.6 
                }}
              >
                <Popup>
                  <strong>Type: {report.processed_type}</strong><br/>
                  Urgency: {report.urgency_score}<br/>
                  Reported at: {new Date(report.createdAt).toLocaleString()}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Priority Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Priority Alerts
            </h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {tasks.filter(t => t.status !== 'completed').slice(0, 10).map(task => (
              <div key={task._id} className="p-3 border rounded-lg hover:shadow-md transition bg-white relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority >= 70 ? 'bg-red-500' : task.priority >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <div className="pl-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100">{task.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Status: {task.status}</p>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No active tasks</p>}
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
             <Activity className="w-5 h-5 mr-2 text-blue-500" /> Live Activity Feed
          </h2>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {feed.length > 0 ? feed.map((item) => (
              <li key={item.id} className="flex items-center text-sm">
                <span className="text-gray-400 w-24 flex-shrink-0">{item.time}</span>
                <span className="text-gray-700">{item.msg}</span>
              </li>
            )) : <li className="text-sm text-gray-400">Waiting for activity...</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-4 rounded-full bg-gray-50 ${color}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );
}
