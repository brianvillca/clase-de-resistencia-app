import React, { useState } from 'react';
import { SqlLogEntry } from '../types';
import { StorageService } from '../services/storageService';

interface SqlConsoleModalProps {
  logs: SqlLogEntry[];
  onLimpiarLogs: () => void;
  onCerrar: () => void;
}

export const SqlConsoleModal: React.FC<SqlConsoleModalProps> = ({
  logs,
  onLimpiarLogs,
  onCerrar,
}) => {
  const [filtroOp, setFiltroOp] = useState<string>('TODAS');

  const logsFiltrados = logs.filter(l => {
    if (filtroOp === 'TODAS') return true;
    return l.operation === filtroOp;
  });

  const getBadgeColor = (op: SqlLogEntry['operation']) => {
    switch (op) {
      case 'SELECT': return 'bg-info text-dark';
      case 'INSERT': return 'bg-success text-white';
      case 'UPDATE': return 'bg-warning text-dark';
      case 'DELETE': return 'bg-danger text-white';
      case 'CONNECT': return 'bg-primary text-white';
      default: return 'bg-secondary text-white';
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4" id="consola-sql-container">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 font-light text-white tracking-wide mb-0">
              <i className="bi bi-terminal-fill me-2 text-emerald-400"></i>
              Consola y Auditoría de SQL Server
            </h1>
            <span className="px-2.5 py-1 bg-[#1A1A1A] text-emerald-400 border border-[#333] rounded font-mono text-xs">
              Microsoft.Data.SqlClient Event Tracing
            </span>
          </div>
          <p className="text-gray-400 small mb-0">
            Registro en tiempo real de sentencias parametrizadas, tiempos de ejecución y estado de transacciones.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/50 btn-sm d-flex align-items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all"
            onClick={onLimpiarLogs}
            disabled={logs.length === 0}
            id="btn-limpiar-logs-sql"
          >
            <i className="bi bi-trash"></i>
            Limpiar Registro
          </button>
          <button
            type="button"
            className="btn bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] btn-sm rounded-lg px-3 py-1.5 text-xs transition-all"
            onClick={onCerrar}
            id="btn-volver-catalogo-desde-sql"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>

      {/* Barra de Filtros por Operación */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-3 mb-3 shadow-lg">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex flex-wrap gap-1.5">
            {['TODAS', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CONNECT'].map((op) => (
              <button
                key={op}
                type="button"
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  filtroOp === op
                    ? 'bg-emerald-600 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#333]'
                }`}
                onClick={() => setFiltroOp(op)}
              >
                {op}
              </button>
            ))}
          </div>

          <span className="small text-gray-500 font-mono text-xs">
            {logsFiltrados.length} evento(s) registrados
          </span>
        </div>
      </div>

      {/* Lista de Registros SQL */}
      <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-2xl overflow-hidden">
        <div>
          {logsFiltrados.length === 0 ? (
            <div className="text-center py-5 text-gray-500">
              <i className="bi bi-journal-code display-4 d-block mb-2 opacity-30 text-gray-400"></i>
              <div className="h5 font-light text-gray-300 mb-1">No hay comandos registrados todavía</div>
              <p className="small text-gray-500">
                Ejecute consultas, registros, modificaciones o eliminaciones para ver las sentencias SQL en vivo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2A2A2A] font-mono text-xs">
              {logsFiltrados.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-[#161616] transition-colors">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${getBadgeColor(log.operation)} px-2 py-1`}>
                        {log.operation}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/40 text-red-400 border border-red-900/50'}`}>
                        {log.status === 'SUCCESS' ? 'OK 200' : 'SQL ERROR'}
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      {log.rowsAffected !== undefined && (
                        <span className="text-gray-400">
                          Filas afectadas: <strong className="text-white">{log.rowsAffected}</strong>
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#1A1A1A] text-gray-400 border border-[#333] rounded">
                        <i className="bi bi-stopwatch me-1 text-emerald-400"></i>
                        {log.durationMs} ms
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0A0A0A] text-emerald-400 rounded-lg font-mono text-xs mb-2 overflow-x-auto border border-[#222]">
                    <span>{log.query}</span>
                  </div>

                  {log.parameters && Object.keys(log.parameters).length > 0 && (
                    <div className="text-xs text-gray-400 bg-[#161616] p-2.5 rounded-lg border border-[#2A2A2A]">
                      <strong className="text-gray-300 me-2">Parámetros SqlCommand:</strong>
                      {Object.entries(log.parameters).map(([k, v]) => (
                        <span key={k} className="inline-block px-2 py-0.5 bg-[#1F1F1F] text-emerald-400 border border-[#333] rounded me-1 text-[11px]">
                          {k} = {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  {log.errorMessage && (
                    <div className="mt-2 bg-red-950/30 border border-red-900/50 text-red-300 py-1.5 px-3 rounded-lg text-xs font-mono">
                      <i className="bi bi-bug me-1 text-red-400"></i>
                      {log.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
