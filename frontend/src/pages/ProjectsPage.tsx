import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckSquare } from 'lucide-react';
import { projectsApi } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import axios from 'axios';

export function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(name, description || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setFormError('');
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        setFormError(err.response?.data?.message || 'Failed to create project');
      }
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project name is required');
      return;
    }
    createMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            New Project
          </Button>
        )}
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 text-sm">
            {user?.role === 'ADMIN'
              ? 'Create your first project to get started.'
              : 'You haven\'t been added to any projects yet.'}
          </p>
          {user?.role === 'ADMIN' && (
            <Button onClick={() => setIsModalOpen(true)} className="mt-4">
              <Plus size={16} /> Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FolderKanban size={20} className="text-indigo-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckSquare size={14} />
                  {project._count?.tasks ?? 0} task{(project._count?.tasks ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                by {project.owner.name} · {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormError('');
          setName('');
          setDescription('');
        }}
        title="Create New Project"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}
          <Input
            id="project-name"
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website Redesign"
            required
          />
          <Textarea
            id="project-desc"
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
