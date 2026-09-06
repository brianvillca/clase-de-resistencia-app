import React, { useState } from 'react';
import { DatabaseConfig } from '../types';
import { StorageService } from '../services/storageService';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onUpdateConfig: (newConfig: DatabaseConfig) => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [formData, setFormData] = useState<DatabaseConfig>({ ...config });
  const [probando, setProbando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<{
    success: boolean;
    mensaje: string;
    latencyMs?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleProbarConexion = async () => {
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const resultado = await StorageService.probarConexion(formData);
      setResultadoPrueba(resultado);
    } catch (err: any) {
      setResultadoPrueba({
        success: false,
        mensaje: err.message || 'Fallo crítico al conectar con el servidor SQL Server.'
      });
    } finally {
      setProbando(false);
    }
  };

  const handleGuardarConfig = () => {
    StorageService.guardarConfig(formData);
    onUpdateConfig(formData);
    onClose();
  };

  const connectionStringGenerado = `Server=${formData.server};Database=${formData.database};Integrated Security=${formData.integratedSecurity};TrustServerCertificate=${formData.trustServerCertificate};Connect Timeout=${formData.timeoutSeconds};`;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)' }}
      id="modal-configuracion-sqlserver"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content bg-[#121212] border border-[#2A2A2A] shadow-2xl rounded-xl text-[#E0E0E0] overflow-hidden">
          <div className="modal-header bg-[#161616] border-b border-[#2A2A2A] py-3 px-4">
            <h5 className="modal-title fs-6 d-flex align-items-center gap-2 font-medium text-white mb-0">
              <i className="bi bi-hdd-network-fill text-emerald-400"></i>
              <span>Configuración y Diagnóstico de SQL Server</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              style={{ filter: 'invert(1)' }}
              aria-label="Cerrar"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="bg-emerald-950/25 border border-emerald-900/40 text-emerald-300/90 rounded-lg p-3 text-xs d-flex align-items-center gap-2 mb-4">
              <i className="bi bi-shield-check fs-5 text-emerald-400 flex-shrink-0"></i>
              <div>
                <strong className="text-white">Sistema de Conexión Robusto:</strong> Implementa reintentos automáticos (Exponential Backoff), detección de errores transitorios (Timeouts, Caída temporal de red) y traducción de códigos de error de <code>SqlException</code>.
              </div>
            </div>

            {/* Parámetros de Conexión */}
            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Servidor / Instancia SQL Server</label>
                <input
                  type="text"
                  className="form-control font-mono bg-[#1A1A1A] border-[#333] text-white placeholder-gray-600 focus:border-emerald-500 text-sm"
                  value={formData.server}
                  onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                  placeholder="localhost\SQLEXPRESS o (localdb)\MSSQLLocalDB"
                />
                <div className="text-[11px] text-gray-500 mt-1">
                  Instancia local de SQL Server Express, LocalDB o contenedor Docker.
                </div>
              </div>

              <div className="col-md-5">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Base de Datos</label>
                <input
                  type="text"
                  className="form-control font-mono bg-[#1A1A1A] border-[#333] text-white placeholder-gray-600 focus:border-emerald-500 text-sm"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  placeholder="EmpresaDB"
                />
                <div className="text-[11px] text-gray-500 mt-1">Catálogo de persistencia (dbo.Productos).</div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Timeout de Conexión (seg)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  className="form-control font-mono bg-[#1A1A1A] border-[#333] text-white placeholder-gray-600 focus:border-emerald-500 text-sm"
                  value={formData.timeoutSeconds}
                  onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="col-md-4 d-flex align-items-center pt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="chk-integrated-sec"
                    checked={formData.integratedSecurity}
                    onChange={(e) => setFormData({ ...formData, integratedSecurity: e.target.checked })}
                  />
                  <label className="form-check-label text-xs text-gray-300" htmlFor="chk-integrated-sec">
                    Autenticación Integrada (Windows Auth)
                  </label>
                </div>
              </div>

              <div className="col-md-4 d-flex align-items-center pt-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="chk-trust-cert"
                    checked={formData.trustServerCertificate}
                    onChange={(e) => setFormData({ ...formData, trustServerCertificate: e.target.checked })}
                  />
                  <label className="form-check-label text-xs text-gray-300" htmlFor="chk-trust-cert">
                    Trust Server Certificate (SSL)
                  </label>
                </div>
              </div>
            </div>

            {/* Cadena de Conexión Resultante */}
            <div className="mb-4">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                Cadena de Conexión (DefaultConnection en appsettings.json)
              </label>
              <div className="p-2.5 bg-[#0A0A0A] text-emerald-400 rounded-lg font-mono text-xs border border-[#2A2A2A] text-break">
                {connectionStringGenerado}
              </div>
            </div>

            {/* Simulador de Errores para pruebas de robustez */}
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="font-semibold text-xs text-amber-300 d-flex align-items-center gap-1.5">
                  <i className="bi bi-bug-fill text-amber-400"></i>
                  Laboratorio de Pruebas de Resiliencia y Manejo de Errores:
                </span>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="chk-simular-errores"
                    checked={formData.simulateErrors}
                    onChange={(e) => setFormData({ ...formData, simulateErrors: e.target.checked })}
                  />
                  <label className="form-check-label text-xs text-amber-300" htmlFor="chk-simular-errores">
                    Simular Falla SQL
                  </label>
                </div>
              </div>

              {formData.simulateErrors && (
                <div className="mt-2">
                  <label className="block text-[10px] text-gray-400 mb-1">Seleccionar tipo de error a simular:</label>
                  <select
                    className="form-select form-select-sm font-mono bg-[#1A1A1A] border-[#333] text-white text-xs"
                    value={formData.errorTypeToSimulate}
                    onChange={(e) => setFormData({ ...formData, errorTypeToSimulate: e.target.value as any })}
                  >
                    <option value="connection_timeout">SqlException (-2): Timeout de conexión (Servidor no responde)</option>
                    <option value="login_failed">SqlException (18456): Error de autenticación / Login fallido</option>
                    <option value="server_down">SqlException (53 / 4060): Servidor SQL Server inaccesible o apagado</option>
                  </select>
                  <div className="text-[11px] text-red-400 mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    Al activar esto, las operaciones mostrarán cómo el código C# y Razor atrapa la excepción y la presenta con elegancia en el ModelState.
                  </div>
                </div>
              )}
            </div>

            {/* Resultado de la Prueba de Conexión */}
            {resultadoPrueba && (
              <div
                className={`p-3 rounded-lg text-xs mb-0 d-flex align-items-center justify-content-between ${
                  resultadoPrueba.success
                    ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-300'
                    : 'bg-red-950/30 border border-red-900/50 text-red-300'
                }`}
              >
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`bi ${
                      resultadoPrueba.success ? 'bi-check-circle-fill fs-5 text-emerald-400' : 'bi-x-circle-fill fs-5 text-red-400'
                    }`}
                  ></i>
                  <div>
                    <strong>{resultadoPrueba.success ? 'Conexión Exitosa' : 'Fallo en la Conexión'}:</strong>
                    <div className="font-mono mt-0.5">{resultadoPrueba.mensaje}</div>
                  </div>
                </div>
                {resultadoPrueba.latencyMs && (
                  <span className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded font-mono text-emerald-400 text-xs">{resultadoPrueba.latencyMs} ms</span>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer bg-[#161616] py-3 px-4 border-t border-[#2A2A2A] d-flex justify-content-between">
            <button
              type="button"
              className="btn bg-[#1A1A1A] hover:bg-[#252525] text-emerald-400 border border-emerald-900/40 rounded-lg text-xs d-flex align-items-center gap-1.5 px-3 py-2"
              onClick={handleProbarConexion}
              disabled={probando}
              id="btn-probar-conexion-sql"
            >
              {probando ? (
                <>
                  <span className="spinner-border spinner-border-sm text-emerald-400" role="status"></span>
                  <span>Verificando ping SQL...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-play-circle-fill"></i>
                  <span>Probar Conexión (Ping SQL)</span>
                </>
              )}
            </button>

            <div className="d-flex gap-2">
              <button type="button" className="btn bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 border border-[#333] rounded-lg text-xs px-3 py-2" onClick={onClose}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs px-4 py-2 border-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                onClick={handleGuardarConfig}
                id="btn-guardar-config-sql"
              >
                Aplicar y Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
