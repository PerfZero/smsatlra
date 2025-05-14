import { Role } from '@prisma/client';

export interface AdminRequest {
  role: Role;
}

export { Role }; 