import { useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, ArrowLeft, Users, Trash2, UserPlus, Edit2, Check, X,
} from 'lucide-react';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PriorityBadge, RoleBadge } from '../components/ui/Badge';
import { Task, TaskStatus, Priority } from '../types';
import axios from 'axios';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  // Form state for new task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskError, setTaskError] = useState('');

  // Member form state
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [memberError, setMemberError] = useState('');

  // Project edit form
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  });

  const allUsersQuery = useQuery({
    queryKey: ['all-users'],
    queryFn: projectsApi.getAllUsers,
  });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      tasksApi.create(id!, {
        title: taskTitle,
        description: taskDesc || undefined,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        assigneeId: taskAssigneeId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsTaskModalOpen(false);
      resetTaskForm();
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setTaskError(err.response?.data?.message || 'Failed to create task');
      }
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (updates: { taskId: string; data: Partial<Task> }) =>
      tasksApi.update(id!, updates.taskId, updates.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditingTask(null);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setTaskError(err.response?.data?.message || 'Failed to update task');
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(id!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: () => projectsApi.addMember(id!, memberUserId, memberRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsMemberModalOpen(false);
      setMemberUserId('');
      setMemberError('');
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setMemberError(err.response?.data?.message || 'Failed to add member');
      }
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(id!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: () => projectsApi.update(id!, editName, editDesc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditProjectOpen(false);
    },
  });

  function resetTaskForm() {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskDueDate('');
    setTaskAssigneeId('');
    setTaskError('');
  }

  const project = projectQuery.data;

  // Determine if current user is an admin of THIS project
  const isProjectAdmin =
    user?.role === 'ADMIN' ||
    project?.members.find((m) => m.userId === user?.id)?.role === 'ADMIN';

  // Users not already in the project
  const nonMembers = (allUsersQuery.data || []).filter(
    (u) => !project?.members.some((m) => m.userId === u.id)
  );

  if (projectQuery.isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Project not found or access denied.</p>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
          <ArrowLeft size={16} /> Back to Projects
        </Button>
      </div>
    );
  }

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    TODO: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  };
  (project.tasks || []).forEach((t) => tasksByStatus[t.status].push(t));

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'TODO', label: 'To Do', color: 'bg-gray-100' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
    { status: 'COMPLETED', label: 'Completed', color: 'bg-green-100' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft size={14} /> Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isProjectAdmin && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditName(project.name);
                  setEditDesc(project.description || '');
                  setIsEditProjectOpen(true);
                }}
              >
                <Edit2 size={14} /> Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMemberModalOpen(true)}
              >
                <UserPlus size={14} /> Add Member
              </Button>
              <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={14} /> Add Task
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Team Members</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                {member.user.name[0].toUpperCase()}
              </div>
              <span className="text-gray-700">{member.user.name}</span>
              <RoleBadge role={member.role} />
              {isProjectAdmin && member.userId !== project.ownerId && member.userId !== user?.id && (
                <button
                  onClick={() => removeMemberMutation.mutate(member.userId)}
                  className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(({ status, label, color }) => (
          <div key={status} className="space-y-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              <span className="ml-auto text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5">
                {tasksByStatus[status].length}
              </span>
            </div>

            <div className="space-y-3">
              {tasksByStatus[status].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isProjectAdmin={!!isProjectAdmin}
                  currentUserId={user?.id || ''}
                  onStatusChange={(newStatus) =>
                    updateTaskMutation.mutate({ taskId: task.id, data: { status: newStatus } })
                  }
                  onEdit={() => {
                    setEditingTask(task);
                    setTaskTitle(task.title);
                    setTaskDesc(task.description || '');
                    setTaskPriority(task.priority);
                    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
                    setTaskAssigneeId(task.assigneeId || '');
                  }}
                  onDelete={() => {
                    if (confirm('Delete this task?')) {
                      deleteTaskMutation.mutate(task.id);
                    }
                  }}
                />
              ))}

              {tasksByStatus[status].length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); resetTaskForm(); }}
        title="Create Task"
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!taskTitle.trim()) { setTaskError('Title is required'); return; }
            createTaskMutation.mutate();
          }}
          className="space-y-4"
        >
          {taskError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{taskError}</div>
          )}
          <Input label="Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" required />
          <Textarea label="Description (optional)" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
            <Input label="Due Date" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
          </div>
          <Select label="Assignee (optional)" value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.user.name}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setIsTaskModalOpen(false); resetTaskForm(); }}>Cancel</Button>
            <Button type="submit" isLoading={createTaskMutation.isPending}>Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => { setEditingTask(null); resetTaskForm(); }}
        title="Edit Task"
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!editingTask) return;
            updateTaskMutation.mutate({
              taskId: editingTask.id,
              data: {
                title: taskTitle,
                description: taskDesc,
                priority: taskPriority,
                dueDate: taskDueDate || undefined,
                assigneeId: taskAssigneeId || undefined,
              },
            });
          }}
          className="space-y-4"
        >
          {taskError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{taskError}</div>
          )}
          <Input label="Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
          <Textarea label="Description" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
            <Input label="Due Date" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
          </div>
          <Select label="Assignee" value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
            <option value="">Unassigned</option>
            {project.members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.user.name}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setEditingTask(null); resetTaskForm(); }}>Cancel</Button>
            <Button type="submit" isLoading={updateTaskMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => { setIsMemberModalOpen(false); setMemberError(''); }}
        title="Add Team Member"
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!memberUserId) { setMemberError('Select a user'); return; }
            addMemberMutation.mutate();
          }}
          className="space-y-4"
        >
          {memberError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{memberError}</div>
          )}
          <Select label="User" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
            <option value="">Select a user...</option>
            {nonMembers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </Select>
          <Select label="Role" value={memberRole} onChange={(e) => setMemberRole(e.target.value as 'ADMIN' | 'MEMBER')}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
          {nonMembers.length === 0 && (
            <p className="text-sm text-gray-500">All users are already members of this project.</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsMemberModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={addMemberMutation.isPending} disabled={nonMembers.length === 0}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title="Edit Project"
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            updateProjectMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Project Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Textarea label="Description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditProjectOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={updateProjectMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isProjectAdmin: boolean;
  currentUserId: string;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskCard({ task, isProjectAdmin, currentUserId, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const canEdit = isProjectAdmin || task.assigneeId === currentUserId;

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
    COMPLETED: 'TODO',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</h4>
        {canEdit && (
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors">
              <Edit2 size={12} />
            </button>
            {isProjectAdmin && (
              <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
            {isOverdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
            {task.assignee.name[0].toUpperCase()}
          </div>
          <span className="text-xs text-gray-500">{task.assignee.name}</span>
        </div>
      )}

      {/* Quick status toggle */}
      {canEdit && task.status !== 'COMPLETED' && (
        <button
          onClick={() => onStatusChange(nextStatus[task.status])}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 transition-colors"
        >
          <Check size={12} />
          {task.status === 'TODO' ? 'Start' : 'Complete'}
        </button>
      )}
    </div>
  );
}
