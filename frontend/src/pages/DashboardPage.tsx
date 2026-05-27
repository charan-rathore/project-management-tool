import { useQuery } from '@tanstack/react-query';
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 30000, // auto-refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your projects.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Projects"
          value={data.totalProjects}
          icon={<FolderKanban size={20} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          label="Total Tasks"
          value={data.totalTasks}
          icon={<ListTodo size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Completed"
          value={data.completedTasks}
          icon={<CheckCircle2 size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Overdue"
          value={data.overdueTasks}
          icon={<AlertCircle size={20} className="text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">To Do</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.todoTasks}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
            <div
              className="h-full bg-gray-400 rounded-full"
              style={{
                width: data.totalTasks > 0 ? `${(data.todoTasks / data.totalTasks) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.inProgressTasks}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: data.totalTasks > 0 ? `${(data.inProgressTasks / data.totalTasks) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.completedTasks}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{
                width: data.totalTasks > 0 ? `${(data.completedTasks / data.totalTasks) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      {data.recentTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{task.title}</p>
                  {task.project && (
                    <Link
                      to={`/projects/${task.project.id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {task.project.name}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.dueDate && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentTasks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ListTodo size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No tasks yet. Create a project and add some tasks!</p>
          <Link to="/projects" className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline">
            Go to Projects →
          </Link>
        </div>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
