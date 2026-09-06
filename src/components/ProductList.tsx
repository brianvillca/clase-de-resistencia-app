import React, { useState, useMemo } from 'react';
import { Producto } from '../types';

interface ProductListProps {
  productos: Producto[];
  onNuevoProducto: () => void;
  onModificarProducto: (producto: Producto) => void;
  onSolicitarEliminar: (producto: Producto) => void;
  onRestablecerDatos: () => void;
  mensajeExito?: string | null;
  mensajeError?: string | null;
  onCerrarMensajeExito: () => void;
  onCerrarMensajeError: () => void;
  onVerCodigoFuente: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  productos,
  onNuevoProducto,
  onModificarProducto,
  onSolicitarEliminar,
  onRestablecerDatos,
  mensajeExito,
  mensajeError,
  onCerrarMensajeExito,
  onCerrarMensajeError,
  onVerCodigoFuente,
}) => {
  const [filtro, setFiltro] = useState('');
  const [ordenCampo, setOrdenCampo] = useState<'codigo' | 'nombre' | 'precio' | 'cantidad'>('codigo');
  const [ordenAsc, setOrdenAsc] = useState<boolean>(true);
  const [filtroStock, setFiltroStock] = useState<'todos' | 'bajo' | 'agotado'>('todos');

  // Cálculos de métricas de inventario
  const totalArticulos = productos.length;
  const stockTotal = productos.reduce((acc, p) => acc + p.cantidad, 0);
  const valorInventario = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
  const productosBajoStock = productos.filter(p => p.cantidad > 0 && p.cantidad < 10).length;
  const productosAgotados = productos.filter(p => p.cantidad === 0).length;

  // Filtrado y ordenamiento en memoria
  const productosFiltrados = useMemo(() => {
    let result = [...productos];

    if (filtro.trim() !== '') {
      const term = filtro.toLowerCase().trim();
      result = result.filter(p =>
        p.codigo.toLowerCase().includes(term) ||
        p.nombre.toLowerCase().includes(term)
      );
    }

    if (filtroStock === 'bajo') {
      result = result.filter(p => p.cantidad > 0 && p.cantidad < 10);
    } else if (filtroStock === 'agotado') {
      result = result.filter(p => p.cantidad === 0);
    }

    result.sort((a, b) => {
      let valA: any = a[ordenCampo];
      let valB: any = b[ordenCampo];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        return ordenAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return ordenAsc ? valA - valB : valB - valA;
      }
    });

    return result;
  }, [productos, filtro, ordenCampo, ordenAsc, filtroStock]);

  const handleCambiarOrden = (campo: 'codigo' | 'nombre' | 'precio' | 'cantidad') => {
    if (ordenCampo === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenCampo(campo);
      setOrdenAsc(true);
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(monto);
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4" id="catalogo-productos-view">
      {/* Mensajes de TempData Razor */}
      {mensajeExito && (
        <div className="alert alert-dismissible fade show mb-4 bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 rounded-xl shadow-lg" role="alert" id="alert-mensaje-exito">
          <div className="d-flex align-items-center">
            <i className="bi bi-check-circle-fill fs-5 me-2 text-emerald-400"></i>
            <div>
              <strong className="text-white">¡Operación exitosa!</strong> {mensajeExito}
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ filter: 'invert(1)' }}
            onClick={onCerrarMensajeExito}
            aria-label="Cerrar"
            id="btn-close-mensaje-exito"
          ></button>
        </div>
      )}

      {mensajeError && (
        <div className="alert alert-dismissible fade show mb-4 bg-red-950/40 text-red-300 border border-red-800/60 rounded-xl shadow-lg" role="alert" id="alert-mensaje-error">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill fs-5 me-2 text-red-400"></i>
            <div>
              <strong className="text-white">Error en la operación:</strong> {mensajeError}
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            style={{ filter: 'invert(1)' }}
            onClick={onCerrarMensajeError}
            aria-label="Cerrar"
            id="btn-close-mensaje-error"
          ></button>
        </div>
      )}

      {/* Título de la Página y Acciones Principales */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 font-light text-white tracking-wide mb-0">Catálogo de Productos</h1>
            <span className="px-2.5 py-1 bg-[#1A1A1A] text-emerald-400 border border-[#333] rounded font-mono text-xs">
              Pages/Productos/Index.cshtml
            </span>
          </div>
          <p className="text-gray-400 mb-0 small">
            Consulta, búsqueda, modificación y eliminación en tiempo real con persistencia en SQL Server.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            id="btn-nuevo-producto-top"
            onClick={onNuevoProducto}
            className="btn d-flex align-items-center gap-2 bg-white hover:bg-gray-100 text-black font-bold py-2 px-4 rounded-lg transition-all shadow-md border-0 text-sm"
            style={{ backgroundColor: '#ffffff' }}
          >
            <i className="bi bi-plus-lg fw-bold"></i>
            <span>Ingresar Producto</span>
          </button>
        </div>
      </div>

      {/* Métricas Corporativas (KPIs) */}
      <div className="row g-3 mb-4" id="kpi-inventory-cards">
        <div className="col-6 col-lg-3">
          <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-xl p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Productos</span>
              <div className="w-7 h-7 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-emerald-400">
                <i className="bi bi-box-seam fs-6"></i>
              </div>
            </div>
            <div className="fs-3 fw-bold text-white">{totalArticulos}</div>
            <small className="text-gray-500">Códigos registrados</small>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-xl p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Unidades en Stock</span>
              <div className="w-7 h-7 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-emerald-400">
                <i className="bi bi-layers fs-6"></i>
              </div>
            </div>
            <div className="fs-3 fw-bold text-emerald-400">{stockTotal}</div>
            <small className="text-gray-500">Stock físico total</small>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-xl p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Valorización</span>
              <div className="w-7 h-7 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-amber-400">
                <i className="bi bi-cash-stack fs-6"></i>
              </div>
            </div>
            <div className="fs-4 fw-bold text-white text-truncate" title={formatearMoneda(valorInventario)}>
              {formatearMoneda(valorInventario)}
            </div>
            <small className="text-gray-500">Costo total inventario</small>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-xl p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Alertas Stock</span>
              <div className="w-7 h-7 rounded bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
                <i className="bi bi-shield-exclamation fs-6"></i>
              </div>
            </div>
            <div className="fs-3 fw-bold text-red-400">
              {productosBajoStock + productosAgotados}
            </div>
            <small className="text-gray-500">
              {productosAgotados} agotados, {productosBajoStock} bajo stock
            </small>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Búsqueda y Ordenamiento */}
      <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] p-3 shadow-xl mb-4" id="search-filter-card">
        <div className="row g-3 align-items-center">
          {/* Input de Búsqueda */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-[#1A1A1A] border-[#333] text-gray-500">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                id="input-filtro-busqueda"
                className="form-control bg-[#1A1A1A] border-[#333] text-gray-200 placeholder-gray-500 focus:border-emerald-500"
                placeholder="Buscar producto por código (ej: PROD-001) o nombre..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
              {filtro && (
                <button
                  className="btn bg-[#1A1A1A] border border-[#333] text-gray-400 hover:text-white"
                  type="button"
                  onClick={() => setFiltro('')}
                  title="Limpiar búsqueda"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filtros rápidos de stock */}
          <div className="col-12 col-md-4">
            <div className="btn-group w-100" role="group" id="btn-group-filtros-stock">
              <button
                type="button"
                className={`btn btn-sm rounded-start transition-all ${
                  filtroStock === 'todos'
                    ? 'bg-emerald-500 text-black font-semibold border-emerald-500'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#333]'
                }`}
                onClick={() => setFiltroStock('todos')}
              >
                Todos ({productos.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm transition-all ${
                  filtroStock === 'bajo'
                    ? 'bg-amber-500 text-black font-semibold border-amber-500'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#333]'
                }`}
                onClick={() => setFiltroStock('bajo')}
              >
                Bajo Stock ({productosBajoStock})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-end transition-all ${
                  filtroStock === 'agotado'
                    ? 'bg-red-500 text-white font-semibold border-red-500'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#333]'
                }`}
                onClick={() => setFiltroStock('agotado')}
              >
                Agotados ({productosAgotados})
              </button>
            </div>
          </div>

          {/* Acciones secundarias */}
          <div className="col-12 col-md-3 d-flex justify-content-md-end gap-2">
            <button
              type="button"
              id="btn-restablecer-datos"
              onClick={onRestablecerDatos}
              className="btn btn-sm bg-[#1A1A1A] hover:bg-[#252525] text-gray-400 hover:text-white border border-[#333] d-flex align-items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all"
              title="Restablecer los productos de prueba iniciales"
            >
              <i className="bi bi-arrow-counterclockwise text-emerald-400"></i>
              <span>Restaurar Semilla</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Productos con Estilo Bootstrap 5 & Elegant Dark */}
      <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-2xl overflow-hidden" id="card-tabla-productos">
        <div className="bg-[#161616] py-3 px-4 border-b border-[#2A2A2A] d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 font-medium text-white fs-6">
              Listado de Productos
            </h5>
            <span className="px-2.5 py-1 bg-[#1A1A1A] text-gray-400 border border-[#333] rounded text-xs font-mono">
              Mostrando {productosFiltrados.length} de {productos.length}
            </span>
          </div>

          <div className="small font-mono text-emerald-400">
            <i className="bi bi-database me-1"></i>
            dbo.Productos (SQL Server)
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0" id="tabla-productos-registrados" style={{ color: '#E0E0E0' }}>
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A] text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th
                  scope="col"
                  className="ps-4 cursor-pointer user-select-none py-3"
                  style={{ width: '18%' }}
                  onClick={() => handleCambiarOrden('codigo')}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>CÓDIGO</span>
                    {ordenCampo === 'codigo' ? (
                      <i className={`bi bi-arrow-${ordenAsc ? 'up' : 'down'} text-emerald-400`}></i>
                    ) : (
                      <i className="bi bi-arrow-down-up opacity-25"></i>
                    )}
                  </div>
                </th>

                <th
                  scope="col"
                  className="cursor-pointer user-select-none py-3"
                  style={{ width: '34%' }}
                  onClick={() => handleCambiarOrden('nombre')}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>NOMBRE DEL PRODUCTO</span>
                    {ordenCampo === 'nombre' ? (
                      <i className={`bi bi-arrow-${ordenAsc ? 'up' : 'down'} text-emerald-400`}></i>
                    ) : (
                      <i className="bi bi-arrow-down-up opacity-25"></i>
                    )}
                  </div>
                </th>

                <th
                  scope="col"
                  className="text-end cursor-pointer user-select-none py-3"
                  style={{ width: '16%' }}
                  onClick={() => handleCambiarOrden('precio')}
                >
                  <div className="d-flex align-items-center justify-content-end gap-1">
                    <span>PRECIO</span>
                    {ordenCampo === 'precio' ? (
                      <i className={`bi bi-arrow-${ordenAsc ? 'up' : 'down'} text-emerald-400`}></i>
                    ) : (
                      <i className="bi bi-arrow-down-up opacity-25"></i>
                    )}
                  </div>
                </th>

                <th
                  scope="col"
                  className="text-center cursor-pointer user-select-none py-3"
                  style={{ width: '14%' }}
                  onClick={() => handleCambiarOrden('cantidad')}
                >
                  <div className="d-flex align-items-center justify-content-center gap-1">
                    <span>STOCK</span>
                    {ordenCampo === 'cantidad' ? (
                      <i className={`bi bi-arrow-${ordenAsc ? 'up' : 'down'} text-emerald-400`}></i>
                    ) : (
                      <i className="bi bi-arrow-down-up opacity-25"></i>
                    )}
                  </div>
                </th>

                <th scope="col" className="text-end pe-4 py-3" style={{ width: '18%' }}>
                  ACCIONES
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2A2A2A]">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="text-gray-400">
                      <i className="bi bi-inbox fs-1 d-block mb-2 text-gray-600"></i>
                      <div className="h5 font-light text-gray-300 mb-1">
                        {filtro ? 'No se encontraron productos coincidentes' : 'No hay productos registrados'}
                      </div>
                      <p className="small text-gray-500 mb-3">
                        {filtro
                          ? `No hay registros con el criterio de búsqueda "${filtro}".`
                          : 'Comience registrando el primer producto en la base de datos.'}
                      </p>
                      <button
                        type="button"
                        onClick={filtro ? () => setFiltro('') : onNuevoProducto}
                        className="btn btn-sm bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 rounded shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      >
                        <i className={`bi ${filtro ? 'bi-x-circle' : 'bi-plus-lg'} me-1`}></i>
                        {filtro ? 'Limpiar Filtro' : 'Registrar Primer Producto'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod, idx) => {
                  const esAgotado = prod.cantidad === 0;
                  const esBajo = prod.cantidad > 0 && prod.cantidad < 10;

                  return (
                    <tr
                      key={prod.codigo}
                      className={`hover:bg-[#181818] transition-colors ${idx % 2 === 1 ? 'bg-[#141414]' : 'bg-[#121212]'}`}
                      id={`fila-producto-${prod.codigo}`}
                      style={{ borderBottom: '1px solid #2A2A2A' }}
                    >
                      {/* Código */}
                      <td className="ps-4 py-3">
                        <span className="font-mono text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/30 rounded border border-emerald-900/40 text-xs">
                          {prod.codigo}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="py-3">
                        <div className="font-medium text-white fs-6">{prod.nombre}</div>
                        {prod.descripcion && (
                          <div className="small text-gray-500 text-truncate" style={{ maxWidth: 380 }}>
                            {prod.descripcion}
                          </div>
                        )}
                        <small className="text-gray-500 font-mono" style={{ fontSize: '0.70rem' }}>
                          <i className="bi bi-clock-history me-1 text-gray-600"></i>
                          {new Date(prod.fechaCreacion).toLocaleDateString('es-AR')}
                          {prod.fechaModificacion && ' · Modificado'}
                        </small>
                      </td>

                      {/* Precio */}
                      <td className="text-end py-3">
                        <div className="font-mono text-emerald-400 font-semibold fs-6">
                          {formatearMoneda(prod.precio)}
                        </div>
                        <small className="text-gray-500" style={{ fontSize: '0.70rem' }}>
                          Unitario
                        </small>
                      </td>

                      {/* Cantidad / Stock */}
                      <td className="text-center py-3">
                        {esAgotado ? (
                          <span className="px-2.5 py-1 bg-red-950/30 text-red-400 border border-red-900/40 rounded text-xs font-mono inline-flex items-center gap-1">
                            <i className="bi bi-x-circle"></i>0 u. (Agotado)
                          </span>
                        ) : esBajo ? (
                          <span className="px-2.5 py-1 bg-yellow-950/30 text-yellow-400 border border-yellow-900/40 rounded text-xs font-mono inline-flex items-center gap-1">
                            <i className="bi bi-exclamation-triangle"></i>{prod.cantidad} u. (Bajo)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-950/30 text-green-400 border border-green-900/40 rounded text-xs font-mono inline-flex items-center gap-1">
                            <i className="bi bi-check2"></i>{prod.cantidad} u.
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="text-end pe-4 py-3">
                        <div className="d-inline-flex align-items-center gap-2">
                          <button
                            type="button"
                            id={`btn-modificar-${prod.codigo}`}
                            onClick={() => onModificarProducto(prod)}
                            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] rounded text-xs transition-all"
                            title={`Modificar producto ${prod.codigo}`}
                          >
                            <i className="bi bi-pencil-square text-emerald-400"></i>
                            <span className="d-none d-sm-inline">Modificar</span>
                          </button>

                          <button
                            type="button"
                            id={`btn-eliminar-${prod.codigo}`}
                            onClick={() => onSolicitarEliminar(prod)}
                            className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/40 rounded text-xs transition-all"
                            title={`Eliminar producto ${prod.codigo}`}
                          >
                            <i className="bi bi-trash3-fill"></i>
                            <span className="d-none d-sm-inline">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {productosFiltrados.length > 0 && (
          <div className="bg-[#161616] py-3 px-4 border-t border-[#2A2A2A] d-flex justify-content-between align-items-center small text-gray-400">
            <span>
              Total valorizado en vista: <strong className="text-emerald-400 font-mono">{formatearMoneda(productosFiltrados.reduce((a, b) => a + (b.precio * b.cantidad), 0))}</strong>
            </span>
            <span className="font-mono text-gray-500 text-xs">
              Persistencia: <span className="text-emerald-400">SQL Server dbo.Productos</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
