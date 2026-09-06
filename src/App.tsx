/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Producto, DatabaseConfig, SqlLogEntry } from './types';
import { StorageService, DEFAULT_DB_CONFIG } from './services/storageService';
import { Navbar } from './components/Navbar';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { DeleteModal } from './components/DeleteModal';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { SqlConsoleModal } from './components/SqlConsoleModal';
import { CSharpCodeViewer } from './components/CSharpCodeViewer';

export default function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [currentTab, setCurrentTab] = useState<'index' | 'crear' | 'editar' | 'codigo' | 'sql'>('index');
  const [productoParaEditar, setProductoParaEditar] = useState<Producto | null>(null);
  const [productoParaEliminar, setProductoParaEliminar] = useState<Producto | null>(null);

  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(DEFAULT_DB_CONFIG);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [sqlLogs, setSqlLogs] = useState<SqlLogEntry[]>([]);

  // Mensajes estilo TempData de ASP.NET Core Razor Pages
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Carga inicial y sincronización con LocalStorage y SQL Server
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    try {
      const config = StorageService.obtenerConfig();
      setDbConfig(config);

      const items = StorageService.obtenerProductos();
      setProductos(items);

      const logs = StorageService.obtenerLogs();
      setSqlLogs(logs);
    } catch (err: any) {
      console.error('Error al inicializar datos:', err);
      setMensajeError(err.message || 'Error de conexión con SQL Server.');
    }
  };

  const actualizarLogs = () => {
    setSqlLogs(StorageService.obtenerLogs());
  };

  // 1. Guardar nuevo producto (Ingresar código, nombre, precio, cantidad)
  const handleGuardarNuevoProducto = async (datos: {
    codigo: string;
    nombre: string;
    precio: number;
    cantidad: number;
  }) => {
    try {
      const nuevo = StorageService.guardarProducto(datos);
      setProductos(StorageService.obtenerProductos());
      actualizarLogs();
      setMensajeExito(`El producto '${nuevo.nombre}' (Código: ${nuevo.codigo}) fue registrado exitosamente en SQL Server.`);
      setMensajeError(null);
      setCurrentTab('index');
    } catch (err: any) {
      actualizarLogs();
      throw err; // El formulario atrapará y mostrará el error en el ModelState
    }
  };

  // 2. Modificar producto existente
  const handleGuardarModificacion = async (datos: {
    codigo: string;
    nombre: string;
    precio: number;
    cantidad: number;
  }) => {
    if (!productoParaEditar) return;
    try {
      const modificado: Producto = {
        ...productoParaEditar,
        nombre: datos.nombre,
        precio: datos.precio,
        cantidad: datos.cantidad,
      };

      StorageService.modificarProducto(modificado);
      setProductos(StorageService.obtenerProductos());
      actualizarLogs();
      setMensajeExito(`El producto '${modificado.codigo} - ${modificado.nombre}' fue modificado exitosamente.`);
      setMensajeError(null);
      setProductoParaEditar(null);
      setCurrentTab('index');
    } catch (err: any) {
      actualizarLogs();
      throw err;
    }
  };

  // 3. Eliminar producto
  const handleConfirmarEliminar = async (codigo: string) => {
    try {
      StorageService.eliminarProducto(codigo);
      setProductos(StorageService.obtenerProductos());
      actualizarLogs();
      setMensajeExito(`El producto con código '${codigo}' fue eliminado de la base de datos.`);
      setMensajeError(null);
      setProductoParaEliminar(null);
    } catch (err: any) {
      actualizarLogs();
      setMensajeError(err.message || 'Error al eliminar el producto.');
      setProductoParaEliminar(null);
    }
  };

  // 4. Iniciar edición
  const handleIniciarEdicion = (producto: Producto) => {
    setProductoParaEditar(producto);
    setCurrentTab('editar');
  };

  // 5. Restablecer datos iniciales de prueba
  const handleRestablecerDatos = () => {
    const restablecidos = StorageService.restablecerDatos();
    setProductos(restablecidos);
    actualizarLogs();
    setMensajeExito('Se han restablecido los 5 productos de prueba iniciales en la base de datos.');
    setMensajeError(null);
  };

  // 6. Limpiar logs de SQL
  const handleLimpiarLogs = () => {
    StorageService.limpiarLogs();
    setSqlLogs([]);
  };

  const codigosExistentes = productos.map((p) => p.codigo);

  return (
    <div className="d-flex flex-column min-vh-100 bg-[#0A0A0A] text-[#E0E0E0] font-sans" id="app-root-layout">
      {/* Barra de Navegación ASP.NET Core Razor Pages & Bootstrap 5 */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'crear') {
            setProductoParaEditar(null);
          }
          setCurrentTab(tab);
        }}
        dbConfig={dbConfig}
        onOpenDbConfig={() => setIsDbModalOpen(true)}
        productCount={productos.length}
      />

      {/* Contenedor de Vistas */}
      <main className="flex-grow-1" id="main-content-view">
        {currentTab === 'index' && (
          <ProductList
            productos={productos}
            onNuevoProducto={() => {
              setProductoParaEditar(null);
              setCurrentTab('crear');
            }}
            onModificarProducto={handleIniciarEdicion}
            onSolicitarEliminar={(prod) => setProductoParaEliminar(prod)}
            onRestablecerDatos={handleRestablecerDatos}
            mensajeExito={mensajeExito}
            mensajeError={mensajeError}
            onCerrarMensajeExito={() => setMensajeExito(null)}
            onCerrarMensajeError={() => setMensajeError(null)}
            onVerCodigoFuente={() => setCurrentTab('codigo')}
          />
        )}

        {currentTab === 'crear' && (
          <ProductForm
            modo="crear"
            onGuardar={handleGuardarNuevoProducto}
            onCancelar={() => setCurrentTab('index')}
            codigosExistentes={codigosExistentes}
          />
        )}

        {currentTab === 'editar' && (
          <ProductForm
            modo="editar"
            productoInicial={productoParaEditar}
            onGuardar={handleGuardarModificacion}
            onCancelar={() => {
              setProductoParaEditar(null);
              setCurrentTab('index');
            }}
            codigosExistentes={codigosExistentes}
          />
        )}

        {currentTab === 'codigo' && (
          <CSharpCodeViewer onVolver={() => setCurrentTab('index')} />
        )}

        {currentTab === 'sql' && (
          <SqlConsoleModal
            logs={sqlLogs}
            onLimpiarLogs={handleLimpiarLogs}
            onCerrar={() => setCurrentTab('index')}
          />
        )}
      </main>

      {/* Modal de Confirmación de Eliminación */}
      {productoParaEliminar && (
        <DeleteModal
          producto={productoParaEliminar}
          onConfirmar={handleConfirmarEliminar}
          onCancelar={() => setProductoParaEliminar(null)}
        />
      )}

      {/* Modal de Configuración y Diagnóstico de SQL Server */}
      {isDbModalOpen && (
        <DatabaseStatusModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
          config={dbConfig}
          onUpdateConfig={(nuevaConfig) => {
            setDbConfig(nuevaConfig);
            cargarDatos();
          }}
        />
      )}

      {/* Pie de Página Corporativo */}
      <footer className="footer mt-auto py-3 bg-[#0D0D0D] border-top border-[#2A2A2A] text-center text-gray-500 small" id="app-footer">
        <div className="container d-flex justify-content-center align-items-center">
          <span>
            &copy; {new Date().getFullYear()} Empresa S.A. &bull; Sistema de Gestión de Productos
          </span>
        </div>
      </footer>
    </div>
  );
}
