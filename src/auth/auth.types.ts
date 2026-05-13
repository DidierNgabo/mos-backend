export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  mustChangePassword: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  mustChangePassword: boolean;
}
