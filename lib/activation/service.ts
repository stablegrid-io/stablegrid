// Legacy stub — system removed
// Stub — activation system removed. Types kept for AdminConsole compatibility.

export type ActivationBoardCard = Record<string, any>;
export type ActivationBoardData = { cards: any[]; groups: any[] };
export type ActivationCatalogTaskOption = Record<string, any>;
export type ActivationContentType = string;
export type ActivationItemStatus = string;
export type ActivationScopeType = string;
export type ActivationTaskGroup = Record<string, any>;
export type ActivationTaskStatus = 'todo' | 'in_progress' | 'completed';
export type ActivationTaskType = string;

export class ActivationServiceError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export const getActivationBoardData = async (..._args: any[]): Promise<ActivationBoardData> => ({ cards: [], groups: [] });
export const createActivationTask = async (..._args: any[]): Promise<any> => ({});
export const updateActivationTask = async (..._args: any[]): Promise<any> => ({});
export const deleteActivationTask = async (..._args: any[]): Promise<void> => {};
export const reorderActivationTasks = async (..._args: any[]): Promise<void> => {};
export const reconcileActivationTasksSafely = async (..._args: any[]): Promise<void> => {};
