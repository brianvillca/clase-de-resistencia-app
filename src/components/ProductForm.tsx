import React, { useState, useEffect } from 'react';
import { Producto, ValidationErrors } from '../types';

interface ProductFormProps {
  modo: 'crear' | 'editar';
  productoInicial?: Producto | null;
  onGuardar: (producto: { codigo: string; nombre: string; precio: number; cantidad: number }) => Promise<void>;
  onCancelar: () => void;
  codigosExistentes: string[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
  modo,
  productoInicial,
  onGuardar,
  onCancelar,
  codigosExistentes,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<string>('');
  const [cantidad, setCantidad] = useState<string>('');
  const [errores, setErrores] = useState<ValidationErrors>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  useEffect(() => {
    if (modo === 'editar' && productoInicial) {
      setCodigo(productoInicial.codigo);
      setNombre(productoInicial.nombre);
      setPrecio(productoInicial.precio.toString());
      setCantidad(productoInicial.cantidad.toString());
    } else {
      setCodigo('');
      setNombre('');
      setPrecio('');
      setCantidad('');
    }
    setErrores({});
    setErrorGeneral(null);
  }, [modo, productoInicial]);

  const validarFormulario = (): boolean => {
    const nuevosErrores: ValidationErrors = {};

    // 1. Validar Código
    const codigoTrim = codigo.trim().toUpperCase();
    if (!codigoTrim) {
      nuevosErrores.codigo = 'El código del producto es obligatorio (DataAnnotation [Required]).';
    } else if (codigoTrim.length < 3 || codigoTrim.length > 20) {
      nuevosErrores.codigo = 'El código debe tener entre 3 y 20 caracteres (DataAnnotation [StringLength]).';
    } else if (!/^[A-Z0-9\-_]+$/.test(codigoTrim)) {
      nuevosErrores.codigo = 'El código solo puede contener letras mayúsculas, números y guiones (DataAnnotation [RegularExpression]).';
    } else if (modo === 'crear' && codigosExistentes.includes(codigoTrim)) {
      nuevosErrores.codigo = `El código '${codigoTrim}' ya existe en SQL Server (Violación de Clave Primaria PK_Productos_Codigo).`;
    }

    // 2. Validar Nombre
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      nuevosErrores.nombre = 'El nombre del producto es obligatorio (DataAnnotation [Required]).';
    } else if (nombreTrim.length < 2 || nombreTrim.length > 100) {
      nuevosErrores.nombre = 'El nombre debe tener entre 2 y 100 caracteres (DataAnnotation [StringLength]).';
    }

    // 3. Validar Precio
    if (precio === '' || precio === undefined || precio === null) {
      nuevosErrores.precio = 'El precio es obligatorio (DataAnnotation [Required]).';
    } else {
      const precioNum = parseFloat(precio);
      if (isNaN(precioNum)) {
        nuevosErrores.precio = 'El precio debe ser un valor numérico válido.';
      } else if (precioNum <= 0) {
        nuevosErrores.precio = 'El precio debe ser mayor a 0 (Restricción CHECK: CK_Productos_PrecioPositivo).';
      }
    }

    // 4. Validar Cantidad
    if (cantidad === '' || cantidad === undefined || cantidad === null) {
      nuevosErrores.cantidad = 'La cantidad es obligatoria (DataAnnotation [Required]).';
    } else {
      const cantidadNum = parseInt(cantidad, 10);
      if (isNaN(cantidadNum) || !Number.isInteger(Number(cantidad))) {
        nuevosErrores.cantidad = 'La cantidad debe ser un número entero.';
      } else if (cantidadNum < 0) {
        nuevosErrores.cantidad = 'La cantidad no puede ser negativa (Restricción CHECK: CK_Productos_CantidadNoNegativa).';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);
      await onGuardar({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        cantidad: parseInt(cantidad, 10),
      });
    } catch (err: any) {
      setErrorGeneral(err.message || 'Error al persistir el producto en la base de datos SQL Server.');
    } finally {
      setGuardando(false);
    }
  };

  const esEdicion = modo === 'editar';

  return (
    <div className="container py-4" style={{ maxWidth: '780px' }} id="formulario-producto-container">
      {/* Navegación Breadcrumb */}
      <div className="mb-3">
        <button
          type="button"
          onClick={onCancelar}
          id="btn-volver-catalogo"
          className="btn btn-link text-decoration-none ps-0 text-gray-400 hover:text-emerald-400 d-inline-flex align-items-center gap-1.5 transition-colors"
        >
          <i className="bi bi-arrow-left"></i>
          <span>Volver al Catálogo de Productos</span>
        </button>
      </div>

      {/* Encabezado del Formulario */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <h1 className="h3 font-light text-white tracking-wide mb-0">
            {esEdicion ? 'Modificar Producto' : 'Registrar Producto'}
          </h1>
          <span className="px-2.5 py-1 bg-[#1A1A1A] text-emerald-400 border border-[#333] rounded font-mono text-xs">
            {esEdicion ? 'Pages/Productos/Editar.cshtml' : 'Pages/Productos/Crear.cshtml'}
          </span>
        </div>
        <p className="text-gray-400 small mb-0">
          {esEdicion
            ? 'Actualice los datos del producto. El código actúa como clave primaria inmutable.'
            : 'Complete los campos obligatorios para dar de alta el producto en la base de datos de la empresa.'}
        </p>
      </div>

      {/* Resumen de Errores de Validación (asp-validation-summary="ModelOnly") */}
      {errorGeneral && (
        <div className="alert bg-red-950/40 text-red-300 border border-red-800/60 rounded-xl shadow-lg mb-4" role="alert" id="alert-error-general-formulario">
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-exclamation-octagon-fill fs-5 text-red-400 mt-0.5"></i>
            <div>
              <strong className="d-block text-white">Excepción de SQL Server / ModelState inválido:</strong>
              <span className="small font-mono text-red-300">{errorGeneral}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta del Formulario Elegant Dark */}
      <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] shadow-2xl p-4 p-md-5" id="card-formulario-producto">
        <div className="border-b border-[#2A2A2A] pb-3 mb-4 d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0 font-medium text-white d-flex align-items-center gap-2 fs-6">
            <i className={`bi ${esEdicion ? 'bi-pencil-square text-emerald-400' : 'bi-plus-circle-fill text-emerald-400'}`}></i>
            <span>{esEdicion ? `Editando: ${productoInicial?.codigo}` : 'Datos del Producto'}</span>
          </h5>
          <span className="px-2 py-0.5 bg-[#1A1A1A] text-emerald-400 border border-[#333] rounded text-xs font-mono">
            <i className="bi bi-database-check me-1"></i>
            SQL Server LocalDB
          </span>
        </div>

        <div>
          <form onSubmit={handleSubmit} noValidate id="form-producto-empresa">
            {/* Campo 1: Código */}
            <div className="mb-4" id="grupo-campo-codigo">
              <label htmlFor="input-producto-codigo" className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                1. Código del Producto <span className="text-red-400">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-[#1A1A1A] border-[#333] text-gray-500">
                  <i className="bi bi-upc-scan"></i>
                </span>
                <input
                  type="text"
                  id="input-producto-codigo"
                  name="Codigo"
                  className={`form-control font-mono bg-[#1A1A1A] border-[#333] placeholder-gray-600 focus:border-emerald-500 ${
                    errores.codigo ? 'is-invalid border-red-500' : ''
                  } ${esEdicion ? 'opacity-60 cursor-not-allowed' : ''}`}
                  style={{ color: '#000000' }}
                  placeholder="Ej: PROD-101"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  readOnly={esEdicion}
                  autoFocus={!esEdicion}
                  maxLength={20}
                />
                {esEdicion && (
                  <span className="input-group-text bg-[#1A1A1A] border-[#333] text-gray-500" title="Clave primaria no modificable">
                    <i className="bi bi-lock-fill text-emerald-400"></i>
                  </span>
                )}
              </div>
              {errores.codigo && (
                <div className="text-red-400 mt-1 font-medium text-xs" id="error-codigo">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {errores.codigo}
                </div>
              )}
              <div className="text-[11px] text-gray-500 mt-1">
                {esEdicion
                  ? 'El código es la clave primaria (PRIMARY KEY) y no puede ser alterado una vez creado.'
                  : 'Identificador único alfanumérico (ej: PROD-101, ART-500, TEC-01).'}
              </div>
            </div>

            {/* Campo 2: Nombre */}
            <div className="mb-4" id="grupo-campo-nombre">
              <label htmlFor="input-producto-nombre" className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                2. Nombre del Producto <span className="text-red-400">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-[#1A1A1A] border-[#333] text-gray-500">
                  <i className="bi bi-tag"></i>
                </span>
                <input
                  type="text"
                  id="input-producto-nombre"
                  name="Nombre"
                  className={`form-control bg-[#1A1A1A] border-[#333] placeholder-gray-600 focus:border-emerald-500 ${errores.nombre ? 'is-invalid border-red-500' : ''}`}
                  style={{ color: '#000000' }}
                  placeholder="Ej: Teclado Mecánico RGB Bluetooth"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={100}
                />
              </div>
              {errores.nombre && (
                <div className="text-red-400 mt-1 font-medium text-xs" id="error-nombre">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {errores.nombre}
                </div>
              )}
              <div className="text-[11px] text-gray-500 mt-1">
                Denominación comercial o descripción breve del artículo (2 a 100 caracteres).
              </div>
            </div>

            {/* Campos en 2 columnas: Precio y Cantidad */}
            <div className="row g-3 mb-4">
              {/* Campo 3: Precio */}
              <div className="col-12 col-md-6" id="grupo-campo-precio">
                <label htmlFor="input-producto-precio" className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                  3. Precio Unitario ($) <span className="text-red-400">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-[#1A1A1A] border-[#333] text-emerald-400 font-bold">$</span>
                  <input
                    type="number"
                    id="input-producto-precio"
                    name="Precio"
                    step="0.01"
                    min="0.01"
                    className={`form-control font-mono bg-[#1A1A1A] border-[#333] placeholder-gray-600 focus:border-emerald-500 ${errores.precio ? 'is-invalid border-red-500' : ''}`}
                    style={{ color: '#000000' }}
                    placeholder="0.00"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
                {errores.precio && (
                  <div className="text-red-400 mt-1 font-medium text-xs" id="error-precio">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {errores.precio}
                  </div>
                )}
                <div className="text-[11px] text-gray-500 mt-1">
                  Monto decimal positivo (formato <code className="text-emerald-400">decimal(18,2)</code> en SQL).
                </div>
              </div>

              {/* Campo 4: Cantidad */}
              <div className="col-12 col-md-6" id="grupo-campo-cantidad">
                <label htmlFor="input-producto-cantidad" className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">
                  4. Cantidad en Stock <span className="text-red-400">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-[#1A1A1A] border-[#333] text-gray-500">
                    <i className="bi bi-boxes"></i>
                  </span>
                  <input
                    type="number"
                    id="input-producto-cantidad"
                    name="Cantidad"
                    step="1"
                    min="0"
                    className={`form-control font-mono bg-[#1A1A1A] border-[#333] placeholder-gray-600 focus:border-emerald-500 ${errores.cantidad ? 'is-invalid border-red-500' : ''}`}
                    style={{ color: '#000000' }}
                    placeholder="0"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>
                {errores.cantidad && (
                  <div className="text-red-400 mt-1 font-medium text-xs" id="error-cantidad">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {errores.cantidad}
                  </div>
                )}
                <div className="text-[11px] text-gray-500 mt-1">
                  Unidades físicas disponibles (número entero &gt;= 0).
                </div>
              </div>
            </div>

            <div className="border-t border-[#2A2A2A] pt-4 mt-4">
              {/* Botones de Acción */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                <button
                  type="button"
                  id="btn-cancelar-formulario"
                  onClick={onCancelar}
                  className="btn bg-[#1A1A1A] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] px-4 py-2.5 rounded-lg w-100 w-sm-auto transition-all text-sm"
                  disabled={guardando}
                >
                  <i className="bi bi-x-lg me-1.5"></i>
                  Cancelar
                </button>

                <button
                  type="submit"
                  id="btn-guardar-producto"
                  className="btn bg-white hover:bg-gray-100 text-black font-bold py-2.5 px-5 rounded-lg shadow-md border-0 d-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto transition-all text-sm"
                  style={{ backgroundColor: '#ffffff' }}
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm text-black" role="status" aria-hidden="true"></span>
                      <span>PERSISTIENDO EN SQL SERVER...</span>
                    </>
                  ) : (
                    <>
                      <i className={`bi ${esEdicion ? 'bi-check2-circle' : 'bi-save-fill'}`}></i>
                      <span>{esEdicion ? 'GUARDAR MODIFICACIÓN' : 'GUARDAR PRODUCTO'}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-500 mt-4 mb-0 italic">
                Los datos se persistirán directamente en la base de datos SQL Server configurada localmente.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
