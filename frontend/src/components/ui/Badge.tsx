import { clsx } from 'clsx';
import { TaskStatus, Priority } from '../../types';

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'To Do', className: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'High', className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status];
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={clsx(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
      )}
    >
      {role === 'ADMIN' ? 'Admin' : 'Member'}
    </span>
  );
}
