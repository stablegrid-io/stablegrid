import { notFound } from 'next/navigation';
import tasksData from '@/data/tasks.json';
import { WorkspaceClient } from '@/components/workspace/WorkspaceClient';
import type { Task } from '@/lib/types';

const tasks = tasksData.tasks as Task[];

export default function WorkspacePage({
  params
}: {
  params: { taskId: string };
}) {
  const task = tasks.find((item) => item.id === params.taskId);

  if (!task) {
    notFound();
  }

  return <WorkspaceClient task={task} />;
}
