export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  fechaCreacion: string;
  fechaModificacion?: string;
  categoria?: string;
  descripcion?: string;
}

export interface SqlLogEntry {
  id: string;
  timestamp: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CONNECT' | 'TRANSACTION';
  query: string;
  parameters: Record<string, any>;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  rowsAffected?: number;
}

export interface DatabaseConfig {
  server: string;
  database: string;
  integratedSecurity: boolean;
  trustServerCertificate: boolean;
  timeoutSeconds: number;
  simulateErrors: boolean;
  errorTypeToSimulate: 'none' | 'connection_timeout' | 'login_failed' | 'duplicate_key' | 'server_down';
}

export interface ValidationErrors {
  codigo?: string;
  nombre?: string;
  precio?: string;
  cantidad?: string;
  general?: string;
}
