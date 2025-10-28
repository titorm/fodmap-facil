/**
 * Entidade de Domínio: Usuário
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  language: string;
  notificationsEnabled: boolean;
  currentPhase?: string;
}
