'use client';

import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeployButtonProps {
  isRunning: boolean;
  onDeploy: () => void;
}

export function DeployButton({ isRunning, onDeploy }: DeployButtonProps) {
  return (
    <Button
      type="button"
      onClick={onDeploy}
      disabled={isRunning}
      aria-label="Run mission code"
    >
      <Play className="h-4 w-4" />
      {isRunning ? 'Executing...' : 'Deploy Analysis'}
    </Button>
  );
}
