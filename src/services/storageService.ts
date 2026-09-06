import { Producto, SqlLogEntry, DatabaseConfig } from '../types';

const STORAGE_KEY = 'empresa_productos_db_v1';
const LOGS_KEY = 'empresa_sql_logs_v1';
const CONFIG_KEY = 'empresa_db_config_v1';

const PRODUCTOS_INICIALES: Producto[] = [
  {
    id: '1',
    codigo: 'PROD-001',
    nombre: 'Laptop Lenovo ThinkPad T14',
    precio: 1250.00,
    cantidad: 15,
    fechaCreacion: '2026-03-01T10:00:00Z',
    categoria: 'Computación',
    descripcion: 'Procesador Intel Core i7, 16GB RAM, 512GB SSD'
  },
  {
    id: '2',
    codigo: 'PROD-002',
    nombre: 'Monitor Dell 27 pulgadas 4K UHD',
    precio: 380.50,
    cantidad: 24,
    fechaCreacion: '2026-03-02T11:30:00Z',
    categoria: 'Periféricos',
    descripcion: 'Panel IPS con soporte ergonómico regulable y conexión USB-C'
  },
  {
    id: '3',
    codigo: 'PROD-003',
    nombre: 'Teclado Mecánico Inalámbrico Redragon',
    precio: 95.00,
    cantidad: 40,
    fechaCreacion: '2026-03-03T09:15:00Z',
    categoria: 'Accesorios',
    descripcion: 'Switches táctiles silenciosos, retroiluminación RGB configurable'
  },
  {
    id: '4',
    codigo: 'PROD-004',
    nombre: 'Mouse Ergonómico Vertical Logitech MX',
    precio: 45.00,
    cantidad: 8,
    fechaCreacion: '2026-03-04T14:20:00Z',
    categoria: 'Accesorios',
    descripcion: 'Sensor de alta precisión de 4000 DPI con batería recargable'
  },
  {
    id: '5',
    codigo: 'PROD-005',
    nombre: 'Impresora Multifunción Láser HP LaserJet',
    precio: 290.00,
    cantidad: 4,
    fechaCreacion: '2026-03-05T16:00:00Z',
    categoria: 'Impresión',
    descripcion: 'Impresión a doble cara automática y conectividad Wi-Fi dual'
  }
];

export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  server: 'localhost\\SQLEXPRESS',
  database: 'EmpresaDB',
  integratedSecurity: true,
  trustServerCertificate: true,
  timeoutSeconds: 30,
  simulateErrors: false,
  errorTypeToSimulate: 'none'
};

export class StorageService {
  private static addLog(entry: Omit<SqlLogEntry, 'id' | 'timestamp'>): void {
    try {
      const logs = this.obtenerLogs();
      const newEntry: SqlLogEntry = {
        ...entry,
        id: crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString()
      };
      // Keep up to last 100 entries
      const updatedLogs = [newEntry, ...logs].slice(0, 100);
      localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Error al guardar log de SQL:', e);
    }
  }

  public static obtenerConfig(): DatabaseConfig {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_DB_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error al cargar config de DB:', e);
    }
    return DEFAULT_DB_CONFIG;
  }

  public static guardarConfig(config: DatabaseConfig): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error al guardar config de DB:', e);
    }
  }

  public static obtenerLogs(): SqlLogEntry[] {
    try {
      const logs = localStorage.getItem(LOGS_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  public static limpiarLogs(): void {
    localStorage.removeItem(LOGS_KEY);
  }

  public static restablecerDatos(): Producto[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_INICIALES));
    this.addLog({
      operation: 'INSERT',
      query: `MERGE INTO [dbo].[Productos] AS Target USING (VALUES (...)) AS Source...`,
      parameters: { count: PRODUCTOS_INICIALES.length },
      durationMs: 45,
      status: 'SUCCESS',
      rowsAffected: PRODUCTOS_INICIALES.length
    });
    return PRODUCTOS_INICIALES;
  }

  private static checkSimulatedError(config: DatabaseConfig): void {
    if (!config.simulateErrors) return;

    if (config.errorTypeToSimulate === 'connection_timeout') {
      throw new Error("SqlException (0x80131904 / Error -2): Tiempo de espera agotado. El período de tiempo de espera caducó al intentar conectarse al servidor 'localhost\\SQLEXPRESS'.");
    }
    if (config.errorTypeToSimulate === 'login_failed') {
      throw new Error("SqlException (Error 18456): Falló el inicio de sesión para el usuario de SQL Server. Verifique las credenciales.");
    }
    if (config.errorTypeToSimulate === 'server_down') {
      throw new Error("SqlException (Error 53 / 4060): El servidor SQL Server no existe o se ha denegado el acceso a la red. Error de red al establecer conexión.");
    }
  }

  public static async probarConexion(config: DatabaseConfig): Promise<{ success: boolean; mensaje: string; latencyMs: number }> {
    const start = performance.now();
    await new Promise(res => setTimeout(res, 350 + Math.random() * 250)); // Real latency simulation
    const latency = Math.round(performance.now() - start);

    try {
      this.checkSimulatedError(config);

      this.addLog({
        operation: 'CONNECT',
        query: `SqlConnection.OpenAsync() -> Server=${config.server};Database=${config.database};Integrated Security=${config.integratedSecurity};`,
        parameters: { server: config.server, database: config.database, timeout: config.timeoutSeconds },
        durationMs: latency,
        status: 'SUCCESS'
      });

      return {
        success: true,
        mensaje: `Conexión establecida exitosamente con ${config.server} (${config.database}) en ${latency} ms. Conexión pooled y segura.`,
        latencyMs: latency
      };
    } catch (err: any) {
      this.addLog({
        operation: 'CONNECT',
        query: `SqlConnection.OpenAsync() -> FAILED [${config.server}]`,
        parameters: { server: config.server, database: config.database },
        durationMs: latency,
        status: 'ERROR',
        errorMessage: err.message
      });

      return {
        success: false,
        mensaje: err.message,
        latencyMs: latency
      };
    }
  }

  public static obtenerProductos(filtro?: string): Producto[] {
    const config = this.obtenerConfig();
    const start = performance.now();

    try {
      this.checkSimulatedError(config);

      let items: Producto[] = [];
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        items = PRODUCTOS_INICIALES;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } else {
        items = JSON.parse(data);
      }

      if (filtro && filtro.trim() !== '') {
        const term = filtro.toLowerCase().trim();
        items = items.filter(p =>
          p.codigo.toLowerCase().includes(term) ||
          p.nombre.toLowerCase().includes(term)
        );
      }

      // Ordenar por código ascendente como en SQL
      items.sort((a, b) => a.codigo.localeCompare(b.codigo));

      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'SELECT',
        query: `SELECT Codigo, Nombre, Precio, Cantidad, FechaRegistro FROM [dbo].[Productos] WHERE (@Filtro IS NULL OR Codigo LIKE @Filtro OR Nombre LIKE @Filtro) ORDER BY Codigo ASC;`,
        parameters: { '@Filtro': filtro || null },
        durationMs: duration,
        status: 'SUCCESS',
        rowsAffected: items.length
      });

      return items;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'SELECT',
        query: `SELECT * FROM [dbo].[Productos];`,
        parameters: { '@Filtro': filtro || null },
        durationMs: duration,
        status: 'ERROR',
        errorMessage: err.message
      });
      throw err;
    }
  }

  public static obtenerPorCodigo(codigo: string): Producto | null {
    const productos = this.obtenerProductos();
    return productos.find(p => p.codigo.trim().toUpperCase() === codigo.trim().toUpperCase()) || null;
  }

  public static guardarProducto(producto: Omit<Producto, 'id' | 'fechaCreacion'>): Producto {
    const config = this.obtenerConfig();
    const start = performance.now();

    try {
      this.checkSimulatedError(config);

      const codigoNormalizado = producto.codigo.trim().toUpperCase();

      // Validación estricta de código único (Restricción de Clave Primaria en SQL Server)
      const productos = this.obtenerProductos();
      const existe = productos.some(p => p.codigo.trim().toUpperCase() === codigoNormalizado);
      if (existe) {
        throw new Error(`SqlException (Error 2627): Infracción de la restricción PRIMARY KEY 'PK_Productos_Codigo'. No se puede insertar una clave duplicada en el objeto 'dbo.Productos'. El valor de la clave duplicada es (${codigoNormalizado}).`);
      }

      // Validación de precio > 0 (Check constraint)
      if (producto.precio <= 0) {
        throw new Error("SqlException (Error 547): Instrucción INSERT en conflicto con la restricción CHECK 'CK_Productos_PrecioPositivo'. La columna 'Precio' debe ser mayor a 0.");
      }

      // Validación de cantidad >= 0 (Check constraint)
      if (producto.cantidad < 0) {
        throw new Error("SqlException (Error 547): Instrucción INSERT en conflicto con la restricción CHECK 'CK_Productos_CantidadNoNegativa'. La columna 'Cantidad' no puede ser negativa.");
      }

      const nuevo: Producto = {
        id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
        codigo: codigoNormalizado,
        nombre: producto.nombre.trim(),
        precio: Number(producto.precio),
        cantidad: Math.floor(Number(producto.cantidad)),
        fechaCreacion: new Date().toISOString()
      };

      const actualizados = [...productos, nuevo];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));

      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'INSERT',
        query: `INSERT INTO [dbo].[Productos] ([Codigo], [Nombre], [Precio], [Cantidad], [FechaRegistro]) VALUES (@Codigo, @Nombre, @Precio, @Cantidad, GETDATE());`,
        parameters: {
          '@Codigo': nuevo.codigo,
          '@Nombre': nuevo.nombre,
          '@Precio': nuevo.precio,
          '@Cantidad': nuevo.cantidad
        },
        durationMs: duration,
        status: 'SUCCESS',
        rowsAffected: 1
      });

      return nuevo;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'INSERT',
        query: `INSERT INTO [dbo].[Productos] ([Codigo], [Nombre], [Precio], [Cantidad]) VALUES (@Codigo, @Nombre, @Precio, @Cantidad);`,
        parameters: {
          '@Codigo': producto.codigo,
          '@Nombre': producto.nombre,
          '@Precio': producto.precio,
          '@Cantidad': producto.cantidad
        },
        durationMs: duration,
        status: 'ERROR',
        errorMessage: err.message
      });
      throw err;
    }
  }

  public static modificarProducto(producto: Producto): Producto {
    const config = this.obtenerConfig();
    const start = performance.now();

    try {
      this.checkSimulatedError(config);

      const productos = this.obtenerProductos();
      const index = productos.findIndex(p => p.codigo.trim().toUpperCase() === producto.codigo.trim().toUpperCase());

      if (index === -1) {
        throw new Error(`SqlException: No se encontró ningún registro con la clave primaria Codigo='${producto.codigo}'. 0 filas afectadas.`);
      }

      if (producto.precio <= 0) {
        throw new Error("SqlException (Error 547): La instrucción UPDATE entra en conflicto con la restricción CHECK 'CK_Productos_PrecioPositivo'.");
      }

      if (producto.cantidad < 0) {
        throw new Error("SqlException (Error 547): La instrucción UPDATE entra en conflicto con la restricción CHECK 'CK_Productos_CantidadNoNegativa'.");
      }

      const modificado: Producto = {
        ...productos[index],
        nombre: producto.nombre.trim(),
        precio: Number(producto.precio),
        cantidad: Math.floor(Number(producto.cantidad)),
        fechaModificacion: new Date().toISOString()
      };

      productos[index] = modificado;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));

      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'UPDATE',
        query: `UPDATE [dbo].[Productos] SET [Nombre] = @Nombre, [Precio] = @Precio, [Cantidad] = @Cantidad, [FechaModificacion] = GETDATE() WHERE [Codigo] = @Codigo;`,
        parameters: {
          '@Codigo': modificado.codigo,
          '@Nombre': modificado.nombre,
          '@Precio': modificado.precio,
          '@Cantidad': modificado.cantidad
        },
        durationMs: duration,
        status: 'SUCCESS',
        rowsAffected: 1
      });

      return modificado;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'UPDATE',
        query: `UPDATE [dbo].[Productos] SET [Nombre] = @Nombre, [Precio] = @Precio, [Cantidad] = @Cantidad WHERE [Codigo] = @Codigo;`,
        parameters: {
          '@Codigo': producto.codigo,
          '@Nombre': producto.nombre,
          '@Precio': producto.precio,
          '@Cantidad': producto.cantidad
        },
        durationMs: duration,
        status: 'ERROR',
        errorMessage: err.message
      });
      throw err;
    }
  }

  public static eliminarProducto(codigo: string): void {
    const config = this.obtenerConfig();
    const start = performance.now();

    try {
      this.checkSimulatedError(config);

      const productos = this.obtenerProductos();
      const codigoUpper = codigo.trim().toUpperCase();
      const existe = productos.some(p => p.codigo.trim().toUpperCase() === codigoUpper);

      if (!existe) {
        throw new Error(`SqlException: No se encontró ningún producto con el código '${codigo}' para eliminar.`);
      }

      const filtrados = productos.filter(p => p.codigo.trim().toUpperCase() !== codigoUpper);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));

      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'DELETE',
        query: `DELETE FROM [dbo].[Productos] WHERE [Codigo] = @Codigo;`,
        parameters: { '@Codigo': codigoUpper },
        durationMs: duration,
        status: 'SUCCESS',
        rowsAffected: 1
      });
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      this.addLog({
        operation: 'DELETE',
        query: `DELETE FROM [dbo].[Productos] WHERE [Codigo] = @Codigo;`,
        parameters: { '@Codigo': codigo },
        durationMs: duration,
        status: 'ERROR',
        errorMessage: err.message
      });
      throw err;
    }
  }
}
