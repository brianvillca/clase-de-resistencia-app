import React, { useState } from 'react';
import { CSHARP_CODE_FILES, CodeFile } from '../data/csharpCodeFiles';
import { descargarProyectoCompletoZip } from '../services/zipExportService';

interface CSharpCodeViewerProps {
  onVolver: () => void;
}

export const CSharpCodeViewer: React.FC<CSharpCodeViewerProps> = ({ onVolver }) => {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<CodeFile>(CSHARP_CODE_FILES[0]);
  const [copiado, setCopiado] = useState(false);
  const [descargandoZip, setDescargandoZip] = useState(false);

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(archivoSeleccionado.content);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDescargarZip = async () => {
    try {
      setDescargandoZip(true);
      await descargarProyectoCompletoZip();
    } catch (e) {
      console.error('Error al descargar ZIP:', e);
      alert('Error al generar el archivo ZIP de la solución C#.');
    } finally {
      setDescargandoZip(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4" id="csharp-code-viewer-container">
      {/* Encabezado Principal */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 font-light text-white tracking-wide mb-0">
              <i className="bi bi-file-earmark-code-fill text-emerald-400 me-2"></i>
              Solución C# con Razor Pages &amp; SQL Server (.NET 8)
            </h1>
            <span className="px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded font-mono text-xs">
              Producción / Clean Architecture
            </span>
          </div>
          <p className="text-gray-400 small mb-0">
            Código fuente completo con DataAnnotations, Microsoft.Data.SqlClient, reintentos con backoff exponencial y vistas Razor con Bootstrap 5.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            id="btn-descargar-zip-solucion"
            onClick={handleDescargarZip}
            className="btn bg-emerald-600 hover:bg-emerald-500 text-black font-bold d-flex align-items-center gap-2 rounded-lg px-3.5 py-2 text-xs border-0 shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all"
            disabled={descargandoZip}
          >
            {descargandoZip ? (
              <>
                <span className="spinner-border spinner-border-sm text-black" role="status"></span>
                <span>Comprimiendo .ZIP...</span>
              </>
            ) : (
              <>
                <i className="bi bi-file-earmark-zip-fill fs-6"></i>
                <span>Descargar Solución Completa (.ZIP)</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] rounded-lg px-3 py-2 text-xs transition-all"
            onClick={onVolver}
            id="btn-volver-catalogo-desde-codigo"
          >
            Volver al Catálogo
          </button>
        </div>
      </div>

      {/* Explorador de Código en Dos Columnas */}
      <div className="row g-3">
        {/* Columna Izquierda: Árbol de Archivos de la Solución */}
        <div className="col-12 col-lg-4 col-xl-3">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl shadow-2xl h-100 overflow-hidden">
            <div className="bg-[#161616] py-3 px-4 border-b border-[#2A2A2A] d-flex align-items-center justify-content-between">
              <span className="font-semibold text-xs text-white d-flex align-items-center gap-1.5">
                <i className="bi bi-folder-fill text-amber-400"></i>
                Explorador de Solución .NET
              </span>
              <span className="px-2 py-0.5 bg-[#1A1A1A] text-gray-400 border border-[#333] rounded text-xs font-mono">{CSHARP_CODE_FILES.length} archivos</span>
            </div>

            <div className="divide-y divide-[#2A2A2A] text-xs" style={{ maxHeight: '650px', overflowY: 'auto' }}>
              {CSHARP_CODE_FILES.map((file) => {
                const esActivo = file.path === archivoSeleccionado.path;
                let icono = 'bi-file-earmark-code';
                let colorIcono = 'text-emerald-400';

                if (file.path.endsWith('.cshtml')) {
                  icono = 'bi-filetype-html';
                  colorIcono = 'text-red-400';
                } else if (file.path.endsWith('.sql')) {
                  icono = 'bi-database-fill-gear';
                  colorIcono = 'text-amber-400';
                } else if (file.path.endsWith('.json')) {
                  icono = 'bi-filetype-json';
                  colorIcono = 'text-emerald-400';
                } else if (file.path.endsWith('.md')) {
                  icono = 'bi-file-earmark-text';
                  colorIcono = 'text-cyan-400';
                }

                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setArchivoSeleccionado(file)}
                    className={`w-100 text-start py-2.5 px-3.5 d-flex align-items-center justify-content-between transition-colors border-0 ${
                      esActivo
                        ? 'bg-[#1C1C1C] text-emerald-400 font-semibold border-l-2 border-emerald-400'
                        : 'bg-transparent text-gray-400 hover:bg-[#161616] hover:text-white'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      <i className={`bi ${icono} ${colorIcono} fs-6`}></i>
                      <span className="font-mono text-xs text-truncate">{file.path}</span>
                    </div>
                    {esActivo && <i className="bi bi-chevron-right text-emerald-400 small"></i>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Visor de Contenido del Archivo */}
        <div className="col-12 col-lg-8 col-xl-9">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden">
            {/* Cabecera del Archivo Seleccionado */}
            <div className="bg-[#161616] py-2.5 px-4 border-b border-[#2A2A2A] d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <strong className="text-white font-mono text-sm">{archivoSeleccionado.path}</strong>
                  <span className="px-2 py-0.5 bg-[#1A1A1A] text-emerald-400 border border-[#333] rounded text-[10px] font-mono text-uppercase">
                    {archivoSeleccionado.language}
                  </span>
                </div>
                <small className="text-gray-400 d-block mt-0.5 text-xs">{archivoSeleccionado.description}</small>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={handleCopiarCodigo}
                  id="btn-copiar-archivo-csharp"
                  className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                    copiado
                      ? 'bg-emerald-600 text-black font-bold border-0'
                      : 'bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333]'
                  }`}
                  title="Copiar código al portapapeles"
                >
                  <i className={`bi ${copiado ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                  <span>{copiado ? '¡Copiado!' : 'Copiar Archivo'}</span>
                </button>
              </div>
            </div>

            {/* Código con Resaltado y Números de Línea */}
            <div className="p-0 bg-[#0A0A0A] position-relative">
              <pre
                className="m-0 p-3.5 font-mono text-xs"
                style={{
                  minHeight: '480px',
                  maxHeight: '620px',
                  overflowY: 'auto',
                  lineHeight: '1.5',
                  backgroundColor: '#0A0A0A',
                  color: '#D4D4D4',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <code>{archivoSeleccionado.content}</code>
              </pre>
            </div>

            {/* Pie de Tarjeta con Información de Arquitectura */}
            <div className="bg-[#161616] py-2.5 px-4 border-t border-[#2A2A2A] text-gray-500 text-xs d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>
                <i className="bi bi-info-circle me-1 text-emerald-400"></i>
                Cumple con: Registro (Código, Nombre, Precio, Cantidad), Consulta, Modificación, Eliminación y SQL Server.
              </span>
              <span className="font-mono text-gray-400">
                .NET 8.0 &bull; C# 12 &bull; Razor Pages &bull; ADO.NET
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
