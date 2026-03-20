import { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../utils/socket';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export default function VolunteerApp() {
  const [tasks, setTasks] = useState([]);
  
  // Hardcoded volunteer location simulator
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
      // In MVP, simply fetch all and calculate distance locally, or rely on match Engine. 
      // Let's rely on standard tasks endpoint and calculate mock distance for UI completeness.
      const res = await axios.get(`${API_URL}/tasks`);
      // Filter out completed tasks so they don't clutter the view 
      const activeTasks = res.data.filter(t => t.status !== 'completed');
      setTasks(activeTasks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (id, newStatus) => {
    try {
      await axios.post(`${API_URL}/tasks/${id}/status`, {
        status: newStatus,
        volunteer_id: '60d0fe4f5311236168a109ca' // Fake Volunteer ID
      });
      // socket event will trigger refetch
    } catch (err) {
      console.error(err);
    }
  };

  const getDistance = (lat, lng) => {
    // Basic euclidean distance scaled roughly to km for MVP demo visuals
    const dLat = (lat - myLat) * 111;
    const dLng = (lng - myLng) * 111;
    return Math.sqrt(dLat*dLat + dLng*dLng).toFixed(1);
  };

  return (
    <div className="p-4 max-w-md mx-auto w-full pt-8 h-screen bg-gray-50 flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assigned Tasks</h1>
        <p className="text-gray-500 text-sm">Nearby urgent requests matching your skills</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {tasks.map(task => (
          <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`h-2 ${task.priority >= 70 ? 'bg-red-500' : task.priority >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <div className="p-5 relative">
              <span className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-700">
                Score: {task.priority}
              </span>
              <h3 className="font-bold text-lg text-gray-900 pr-16 leading-tight">{task.title}</h3>
              
              <div className="flex items-center mt-3 text-sm text-gray-500 space-x-4">
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {getDistance(task.location.lat, task.location.lng)} km</span>
                <span className="capitalize bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{task.type}</span>
              </div>

              <div className="mt-5 flex gap-2">
                {task.status === 'pending' && (
                  <button 
                    onClick={() => handleAction(task._id, 'accepted')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center"
                  >
                    Accept Task
                  </button>
                )}
                {task.status === 'accepted' && (
                  <button 
                    onClick={() => handleAction(task._id, 'in_progress')}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center"
                  >
                    <Navigation className="w-4 h-4 mr-2" /> Start Route
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button 
                    onClick={() => handleAction(task._id, 'completed')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">All caught up! No active tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
