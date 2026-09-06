import React, { useState } from 'react';
import { Producto } from '../types';

interface DeleteModalProps {
  producto: Producto | null;
  onConfirmar: (codigo: string) => Promise<void>;
  onCancelar: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  producto,
  onConfirmar,
  onCancelar,
}) => {
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  if (!producto) return null;

  const handleConfirmar = async () => {
    try {
      setEliminando(true);
      setErrorEliminar(null);
      await onConfirmar(producto.codigo);
    } catch (err: any) {
      setErrorEliminar(err.message || 'Error al ejecutar DELETE en SQL Server.');
      setEliminando(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)' }}
      id="modal-eliminar-producto"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content bg-[#121212] border border-[#2A2A2A] shadow-2xl rounded-xl text-white overflow-hidden">
          <div className="modal-header bg-[#161616] border-b border-[#2A2A2A] py-3 px-4">
            <h5 className="modal-title fs-6 d-flex align-items-center gap-2 font-medium text-white mb-0">
              <i className="bi bi-exclamation-triangle-fill text-red-500"></i>
              <span>Confirmar Eliminación de Producto</span>
            </h5>
            <button
              type="button"
              className="btn-close"
              style={{ filter: 'invert(1)' }}
              aria-label="Cerrar"
              onClick={onCancelar}
              disabled={eliminando}
            ></button>
          </div>

          <div className="modal-body p-4">
            <p className="text-red-400 font-medium mb-3 text-sm">
              ¿Está seguro de que desea eliminar permanentemente este producto del catálogo?
            </p>

            {errorEliminar && (
              <div className="alert bg-red-950/40 text-red-300 border border-red-800/60 rounded-lg small mb-3">
                <i className="bi bi-x-circle-fill me-1"></i>
                {errorEliminar}
              </div>
            )}

            <div className="bg-[#1A1A1A] p-3 rounded-lg border border-[#333] mb-3">
              <div className="row g-2 text-xs">
                <div className="col-4 text-gray-500 font-bold uppercase tracking-wider">Código:</div>
                <div className="col-8 font-mono font-semibold text-emerald-400">{producto.codigo}</div>

                <div className="col-4 text-gray-500 font-bold uppercase tracking-wider">Nombre:</div>
                <div className="col-8 text-white font-medium">{producto.nombre}</div>

                <div className="col-4 text-gray-500 font-bold uppercase tracking-wider">Precio:</div>
                <div className="col-8 text-emerald-400 font-bold font-mono">
                  ${producto.precio.toFixed(2)}
                </div>

                <div className="col-4 text-gray-500 font-bold uppercase tracking-wider">Stock:</div>
                <div className="col-8 text-gray-300 font-mono">{producto.cantidad} unidades</div>
              </div>
            </div>

            <div className="bg-yellow-950/25 border border-yellow-900/40 rounded-lg p-3 text-xs text-yellow-300/90 d-flex align-items-center gap-2">
              <i className="bi bi-info-circle-fill fs-5 text-yellow-500 flex-shrink-0"></i>
              <div>
                Esta acción ejecutará una sentencia <code className="text-amber-400 font-mono">DELETE FROM Productos WHERE Codigo = '{producto.codigo}'</code> y no se podrá deshacer.
              </div>
            </div>
          </div>

          <div className="modal-footer bg-[#161616] py-3 px-4 border-t border-[#2A2A2A] d-flex justify-content-between">
            <button
              type="button"
              className="btn bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 border border-[#333] px-3 py-1.5 rounded-lg text-xs"
              onClick={onCancelar}
              disabled={eliminando}
              id="btn-cancelar-eliminar-modal"
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-[0_0_15px_rgba(220,38,38,0.3)] border-0 d-inline-flex align-items-center gap-1.5"
              onClick={handleConfirmar}
              disabled={eliminando}
              id="btn-confirmar-eliminar-modal"
            >
              {eliminando ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Eliminando de SQL...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-trash3-fill"></i>
                  <span>Eliminar Definitivamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
