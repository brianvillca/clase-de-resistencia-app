export interface CodeFile {
  path: string;
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const CSHARP_CODE_FILES: CodeFile[] = [
  {
    path: "Models/Producto.cs",
    filename: "Producto.cs",
    language: "csharp",
    description: "Modelo de datos con DataAnnotations para validación automática en Razor Pages",
    content: `using System;
using System.ComponentModel.DataAnnotations;

namespace EmpresaProductos.Models
{
    /// <summary>
    /// Entidad que representa un producto en el sistema empresarial.
    /// Utiliza DataAnnotations para validación en el cliente y servidor con Razor.
    /// </summary>
    public class Producto
    {
        [Key]
        [Required(ErrorMessage = "El código del producto es obligatorio.")]
        [StringLength(20, MinimumLength = 3, ErrorMessage = "El código debe tener entre 3 y 20 caracteres.")]
        [RegularExpression(@"^[A-Z0-9\\-_]+$", ErrorMessage = "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos.")]
        [Display(Name = "Código del Producto")]
        public string Codigo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre del producto es obligatorio.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
        [Display(Name = "Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El precio es obligatorio.")]
        [Range(0.01, 99999999.99, ErrorMessage = "El precio debe ser mayor a cero (0.01 - 99,999,999.99).")]
        [DataType(DataType.Currency)]
        [Display(Name = "Precio Unitario")]
        public decimal Precio { get; set; }

        [Required(ErrorMessage = "La cantidad es obligatoria.")]
        [Range(0, 1000000, ErrorMessage = "La cantidad debe ser un número entero mayor o igual a 0.")]
        [Display(Name = "Cantidad en Stock")]
        public int Cantidad { get; set; }

        [Display(Name = "Fecha de Registro")]
        [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd HH:mm}")]
        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        [Display(Name = "Última Modificación")]
        public DateTime? FechaModificacion { get; set; }
    }
}
`
  },
  {
    path: "Data/ConexionDB.cs",
    filename: "ConexionDB.cs",
    language: "csharp",
    description: "Gestor robusto de conexión a SQL Server con reintentos y política de resiliencia",
    content: `using System;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EmpresaProductos.Data
{
    /// <summary>
    /// Administrador de conexiones a SQL Server con sistema de reintentos
    /// y captura detallada de excepciones de base de datos.
    /// </summary>
    public class ConexionDB
    {
        private readonly string _connectionString;
        private readonly ILogger<ConexionDB> _logger;
        private const int MaxReintentos = 3;
        private static readonly TimeSpan DemoraInicial = TimeSpan.FromSeconds(1);

        public ConexionDB(IConfiguration configuration, ILogger<ConexionDB> logger)
        {
            _logger = logger;
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'DefaultConnection' en appsettings.json.");
        }

        /// <summary>
        /// Crea y abre una conexión a SQL Server aplicando reintentos automáticos
        /// en caso de errores transitorios de red o sobrecarga.
        /// </summary>
        public async Task<SqlConnection> ObtenerConexionAbiertaAsync()
        {
            int intento = 0;
            TimeSpan demora = DemoraInicial;

            while (true)
            {
                intento++;
                var conexion = new SqlConnection(_connectionString);

                try
                {
                    await conexion.OpenAsync();
                    return conexion;
                }
                catch (SqlException ex) when (EsErrorTransitorio(ex) && intento < MaxReintentos)
                {
                    _logger.LogWarning(ex, 
                        "Fallo transitorio al conectar a SQL Server (intento {Intento} de {MaxReintentos}). Reintentando en {Demora} ms...",
                        intento, MaxReintentos, demora.TotalMilliseconds);

                    await conexion.DisposeAsync();
                    await Task.Delay(demora);
                    demora = TimeSpan.FromSeconds(demora.TotalSeconds * 2); // Exponential backoff
                }
                catch (SqlException ex)
                {
                    await conexion.DisposeAsync();
                    _logger.LogError(ex, "Error crítico de SQL Server (Número: {NumeroError}): {Mensaje}", ex.Number, ex.Message);
                    throw TraducirExcepcionSql(ex);
                }
                catch (Exception ex)
                {
                    await conexion.DisposeAsync();
                    _logger.LogError(ex, "Error no esperado al intentar abrir la conexión con SQL Server.");
                    throw new ApplicationException("No fue posible comunicarse con el servidor de base de datos.", ex);
                }
            }
        }

        private static bool EsErrorTransitorio(SqlException ex)
        {
            // Códigos típicos de errores transitorios en SQL Server:
            // -2: Timeout
            // 4060: Base de datos no disponible temporalmente
            // 10053 / 10054: Conexión interrumpida por la red
            // 10928 / 10929: Límite de recursos alcanzado
            return ex.Number switch
            {
                -2 => true,
                4060 => true,
                10053 or 10054 => true,
                10928 or 10929 => true,
                _ => false
            };
        }

        private static Exception TraducirExcepcionSql(SqlException ex)
        {
            return ex.Number switch
            {
                2627 or 2601 => new InvalidOperationException("Ya existe un producto registrado con ese código. Por favor utilice un código diferente."),
                547 => new InvalidOperationException("La operación viola una restricción de integridad de la base de datos."),
                4060 => new InvalidOperationException("No se pudo acceder a la base de datos especificada. Verifique que la base de datos 'EmpresaDB' exista."),
                18456 => new UnauthorizedAccessException("Credenciales incorrectas para el servidor SQL Server."),
                -2 => new TimeoutException("El servidor SQL Server tardó demasiado en responder. Verifique la carga del servidor."),
                _ => new ApplicationException($"Error de base de datos [{ex.Number}]: {ex.Message}", ex)
            };
        }
    }
}
`
  },
  {
    path: "Data/IProductoRepository.cs",
    filename: "IProductoRepository.cs",
    language: "csharp",
    description: "Interfaz del repositorio de productos para inyección de dependencias",
    content: `using System.Collections.Generic;
using System.Threading.Tasks;
using EmpresaProductos.Models;

namespace EmpresaProductos.Data
{
    public interface IProductoRepository
    {
        Task<IEnumerable<Producto>> ObtenerTodosAsync(string? filtroBusqueda = null);
        Task<Producto?> ObtenerPorCodigoAsync(string codigo);
        Task GuardarAsync(Producto producto);
        Task ModificarAsync(Producto producto);
        Task EliminarAsync(string codigo);
        Task<bool> ExisteCodigoAsync(string codigo);
    }
}
`
  },
  {
    path: "Data/ProductoRepository.cs",
    filename: "ProductoRepository.cs",
    language: "csharp",
    description: "Implementación ADO.NET con consultas parametrizadas y prevención de inyecciones SQL",
    content: `using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using EmpresaProductos.Models;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace EmpresaProductos.Data
{
    public class ProductoRepository : IProductoRepository
    {
        private readonly ConexionDB _conexionDb;
        private readonly ILogger<ProductoRepository> _logger;

        public ProductoRepository(ConexionDB conexionDb, ILogger<ProductoRepository> logger)
        {
            _conexionDb = conexionDb;
            _logger = logger;
        }

        public async Task<IEnumerable<Producto>> ObtenerTodosAsync(string? filtroBusqueda = null)
        {
            var productos = new List<Producto>();

            const string sql = @"
                SELECT Codigo, Nombre, Precio, Cantidad, FechaRegistro, FechaModificacion
                FROM Productos
                WHERE (@Filtro IS NULL OR Codigo LIKE '%' + @Filtro + '%' OR Nombre LIKE '%' + @Filtro + '%')
                ORDER BY Codigo ASC;";

            await using var conexion = await _conexionDb.ObtenerConexionAbiertaAsync();
            await using var comando = new SqlCommand(sql, conexion);

            comando.Parameters.Add(new SqlParameter("@Filtro", SqlDbType.NVarChar, 100)
            {
                Value = string.IsNullOrWhiteSpace(filtroBusqueda) ? DBNull.Value : filtroBusqueda.Trim()
            });

            await using var lector = await comando.ExecuteReaderAsync();
            while (await lector.ReadAsync())
            {
                productos.Add(MapearProducto(lector));
            }

            return productos;
        }

        public async Task<Producto?> ObtenerPorCodigoAsync(string codigo)
        {
            const string sql = @"
                SELECT Codigo, Nombre, Precio, Cantidad, FechaRegistro, FechaModificacion
                FROM Productos
                WHERE Codigo = @Codigo;";

            await using var conexion = await _conexionDb.ObtenerConexionAbiertaAsync();
            await using var comando = new SqlCommand(sql, conexion);
            comando.Parameters.Add(new SqlParameter("@Codigo", SqlDbType.VarChar, 20) { Value = codigo });

            await using var lector = await comando.ExecuteReaderAsync();
            if (await lector.ReadAsync())
            {
                return MapearProducto(lector);
            }

            return null;
        }

        public async Task GuardarAsync(Producto producto)
        {
            const string sql = @"
                INSERT INTO Productos (Codigo, Nombre, Precio, Cantidad, FechaRegistro)
                VALUES (@Codigo, @Nombre, @Precio, @Cantidad, @FechaRegistro);";

            await using var conexion = await _conexionDb.ObtenerConexionAbiertaAsync();
            await using var comando = new SqlCommand(sql, conexion);

            comando.Parameters.Add(new SqlParameter("@Codigo", SqlDbType.VarChar, 20) { Value = producto.Codigo });
            comando.Parameters.Add(new SqlParameter("@Nombre", SqlDbType.NVarChar, 100) { Value = producto.Nombre });
            comando.Parameters.Add(new SqlParameter("@Precio", SqlDbType.Decimal) { Value = producto.Precio, Precision = 18, Scale = 2 });
            comando.Parameters.Add(new SqlParameter("@Cantidad", SqlDbType.Int) { Value = producto.Cantidad });
            comando.Parameters.Add(new SqlParameter("@FechaRegistro", SqlDbType.DateTime2) { Value = DateTime.Now });

            int filasAfectadas = await comando.ExecuteNonQueryAsync();
            if (filasAfectadas == 0)
            {
                throw new ApplicationException("No se pudo insertar el producto en la base de datos.");
            }

            _logger.LogInformation("Producto {Codigo} guardado exitosamente.", producto.Codigo);
        }

        public async Task ModificarAsync(Producto producto)
        {
            const string sql = @"
                UPDATE Productos
                SET Nombre = @Nombre,
                    Precio = @Precio,
                    Cantidad = @Cantidad,
                    FechaModificacion = @FechaModificacion
                WHERE Codigo = @Codigo;";

            await using var conexion = await _conexionDb.ObtenerConexionAbiertaAsync();
            await using var comando = new SqlCommand(sql, conexion);

            comando.Parameters.Add(new SqlParameter("@Codigo", SqlDbType.VarChar, 20) { Value = producto.Codigo });
            comando.Parameters.Add(new SqlParameter("@Nombre", SqlDbType.NVarChar, 100) { Value = producto.Nombre });
            comando.Parameters.Add(new SqlParameter("@Precio", SqlDbType.Decimal) { Value = producto.Precio, Precision = 18, Scale = 2 });
            comando.Parameters.Add(new SqlParameter("@Cantidad", SqlDbType.Int) { Value = producto.Cantidad });
            comando.Parameters.Add(new SqlParameter("@FechaModificacion", SqlDbType.DateTime2) { Value = DateTime.Now });

            int filasAfectadas = await comando.ExecuteNonQueryAsync();
            if (filasAfectadas == 0)
            {
                throw new KeyNotFoundException($"No se encontró ningún producto con el código '{producto.Codigo}' para modificar.");
            }

            _logger.LogInformation("Producto {Codigo} modificado exitosamente.", producto.Codigo);
        }

        public async Task EliminarAsync(string codigo)
        {
            const string sql = "DELETE FROM Productos WHERE Codigo = @Codigo;";

            await using var conexion = await _conexionDb.ObtenerConexionAbiertaAsync();
            await using var comando = new SqlCommand(sql, conexion);
            comando.Parameters.Add(new SqlParameter("@Codigo", SqlDbType.VarChar, 20) { Value = codigo });

            int filasAfectadas = await comando.ExecuteNonQueryAsync();
            if (filasAfectadas == 0)
            {
                throw new KeyNotFoundException($"No se encontró ningún producto con el código '{codigo}' para eliminar.");
            }

            _logger.LogInformation("Producto {Codigo} eliminado exitosamente.", codigo);
        }

        public async Task<bool> ExisteCodigoAsync(string codigo)
        {
            const string sql = "SELECT COUNT(1) FROM Productos WHERE Codigo = @Codigo;";

            await using var conexion = await _conexionDb.ObtenerConexionAbiertaAsync();
            await using var comando = new SqlCommand(sql, conexion);
            comando.Parameters.Add(new SqlParameter("@Codigo", SqlDbType.VarChar, 20) { Value = codigo });

            var resultado = await comando.ExecuteScalarAsync();
            return Convert.ToInt32(resultado) > 0;
        }

        private static Producto MapearProducto(SqlDataReader lector)
        {
            return new Producto
            {
                Codigo = lector.GetString(lector.GetOrdinal("Codigo")),
                Nombre = lector.GetString(lector.GetOrdinal("Nombre")),
                Precio = lector.GetDecimal(lector.GetOrdinal("Precio")),
                Cantidad = lector.GetInt32(lector.GetOrdinal("Cantidad")),
                FechaRegistro = lector.GetDateTime(lector.GetOrdinal("FechaRegistro")),
                FechaModificacion = lector.IsDBNull(lector.GetOrdinal("FechaModificacion")) 
                    ? null 
                    : lector.GetDateTime(lector.GetOrdinal("FechaModificacion"))
            };
        }
    }
}
`
  },
  {
    path: "Pages/Productos/Index.cshtml",
    filename: "Index.cshtml",
    language: "razor",
    description: "Vista Razor para consultar la lista de productos registrados con Bootstrap 5",
    content: `@page
@model EmpresaProductos.Pages.Productos.IndexModel
@{
    ViewData["Title"] = "Catálogo de Productos";
}

<div class="container-fluid py-4">
    <!-- Encabezado de Página -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h1 class="h2 text-primary fw-bold mb-1">
                <i class="bi bi-box-seam me-2"></i>Catálogo de Productos
            </h1>
            <p class="text-muted mb-0">Gestión de inventario de la empresa conectada a SQL Server</p>
        </div>
        <a asp-page="Crear" class="btn btn-primary btn-lg shadow-sm">
            <i class="bi bi-plus-circle me-2"></i>Registrar Nuevo Producto
        </a>
    </div>

    <!-- Alertas de Notificación (TempData) -->
    @if (TempData["MensajeExito"] != null)
    {
        <div class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>@TempData["MensajeExito"]
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    }

    @if (TempData["MensajeError"] != null)
    {
        <div class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>@TempData["MensajeError"]
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    }

    <!-- Barra de Búsqueda y Filtro -->
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-body">
            <form method="get" class="row g-3 align-items-center">
                <div class="col-md-9 col-sm-12">
                    <div class="input-group">
                        <span class="input-group-text bg-white"><i class="bi bi-search text-muted"></i></span>
                        <input type="text" asp-for="Filtro" class="form-control" 
                               placeholder="Buscar por código o nombre de producto..." />
                    </div>
                </div>
                <div class="col-md-3 col-sm-12 d-flex gap-2">
                    <button type="submit" class="btn btn-outline-primary flex-fill">
                        <i class="bi bi-funnel me-1"></i>Filtrar
                    </button>
                    @if (!string.IsNullOrEmpty(Model.Filtro))
                    {
                        <a asp-page="Index" class="btn btn-outline-secondary">Limpiar</a>
                    }
                </div>
            </form>
        </div>
    </div>

    <!-- Tabla de Productos -->
    <div class="card shadow-sm border-0">
        <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-semibold">
                Productos Registrados (@Model.Productos.Count())
            </h5>
            <span class="badge bg-light text-dark border">
                <i class="bi bi-database me-1"></i>SQL Server: Activo
            </span>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th scope="col" style="width: 15%;">Código</th>
                        <th scope="col" style="width: 35%;">Nombre del Producto</th>
                        <th scope="col" class="text-end" style="width: 15%;">Precio</th>
                        <th scope="col" class="text-center" style="width: 15%;">Stock</th>
                        <th scope="col" class="text-end" style="width: 20%;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @if (!Model.Productos.Any())
                    {
                        <tr>
                            <td colspan="5" class="text-center py-5">
                                <i class="bi bi-inbox text-muted display-4 d-block mb-3"></i>
                                <p class="h5 text-muted">No se encontraron productos registrados.</p>
                                <p class="text-secondary small">Comience agregando el primer producto con el botón superior.</p>
                            </td>
                        </tr>
                    }
                    else
                    {
                        @foreach (var prod in Model.Productos)
                        {
                            <tr>
                                <td>
                                    <span class="badge bg-dark-subtle text-dark border font-monospace px-2 py-1">
                                        @prod.Codigo
                                    </span>
                                </td>
                                <td>
                                    <div class="fw-semibold">@prod.Nombre</div>
                                    <small class="text-muted">Reg: @prod.FechaRegistro.ToString("dd/MM/yyyy")</small>
                                </td>
                                <td class="text-end fw-bold text-success">
                                    @prod.Precio.ToString("C2")
                                </td>
                                <td class="text-center">
                                    @if (prod.Cantidad == 0)
                                    {
                                        <span class="badge bg-danger">Agotado (0)</span>
                                    }
                                    else if (prod.Cantidad < 10)
                                    {
                                        <span class="badge bg-warning text-dark">Bajo (@prod.Cantidad)</span>
                                    }
                                    else
                                    {
                                        <span class="badge bg-success-subtle text-success border border-success-subtle">
                                            @prod.Cantidad unidades
                                        </span>
                                    }
                                </td>
                                <td class="text-end">
                                    <div class="btn-group" role="group">
                                        <a asp-page="Editar" asp-route-codigo="@prod.Codigo" 
                                           class="btn btn-outline-secondary btn-sm" title="Modificar">
                                            <i class="bi bi-pencil me-1"></i>Modificar
                                        </a>
                                        <a asp-page="Eliminar" asp-route-codigo="@prod.Codigo" 
                                           class="btn btn-outline-danger btn-sm" title="Eliminar">
                                            <i class="bi bi-trash"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        }
                    }
                </tbody>
            </table>
        </div>
    </div>
</div>
`
  },
  {
    path: "Pages/Productos/Index.cshtml.cs",
    filename: "Index.cshtml.cs",
    language: "csharp",
    description: "PageModel Razor para consulta de productos y gestión de filtros",
    content: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmpresaProductos.Data;
using EmpresaProductos.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace EmpresaProductos.Pages.Productos
{
    public class IndexModel : PageModel
    {
        private readonly IProductoRepository _repositorio;
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(IProductoRepository repositorio, ILogger<IndexModel> logger)
        {
            _repositorio = repositorio;
            _logger = logger;
        }

        public IEnumerable<Producto> Productos { get; set; } = new List<Producto>();

        [BindProperty(SupportsGet = true)]
        public string? Filtro { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                Productos = await _repositorio.ObtenerTodosAsync(Filtro);
                return Page();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al consultar los productos desde SQL Server.");
                TempData["MensajeError"] = "No se pudieron cargar los productos: " + ex.Message;
                Productos = new List<Producto>();
                return Page();
            }
        }
    }
}
`
  },
  {
    path: "Pages/Productos/Crear.cshtml",
    filename: "Crear.cshtml",
    language: "razor",
    description: "Formulario Razor con validaciones para registrar código, nombre, precio y cantidad",
    content: `@page
@model EmpresaProductos.Pages.Productos.CrearModel
@{
    ViewData["Title"] = "Registrar Nuevo Producto";
}

<div class="container py-4" style="max-width: 720px;">
    <div class="mb-4">
        <a asp-page="Index" class="btn btn-link text-decoration-none ps-0">
            <i class="bi bi-arrow-left me-1"></i>Volver al Catálogo
        </a>
        <h1 class="h2 text-primary fw-bold mt-2">
            <i class="bi bi-plus-square me-2"></i>Registrar Producto
        </h1>
        <p class="text-muted">Complete los datos obligatorios para registrar un nuevo producto en SQL Server.</p>
    </div>

    @if (!ViewData.ModelState.IsValid && ViewData.ModelState[""]?.Errors.Count > 0)
    {
        <div class="alert alert-danger shadow-sm mb-4" role="alert">
            <i class="bi bi-exclamation-octagon-fill me-2"></i>
            <div asp-validation-summary="ModelOnly" class="d-inline"></div>
        </div>
    }

    <div class="card shadow-sm border-0">
        <div class="card-body p-4">
            <form method="post" novalidate>
                <!-- Código -->
                <div class="mb-3">
                    <label asp-for="Producto.Codigo" class="form-label fw-semibold"></label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-upc-scan"></i></span>
                        <input asp-for="Producto.Codigo" class="form-control" placeholder="Ej: PROD-101" autofocus />
                    </div>
                    <span asp-validation-for="Producto.Codigo" class="text-danger small"></span>
                    <div class="form-text">Código alfanumérico único para identificar el artículo.</div>
                </div>

                <!-- Nombre -->
                <div class="mb-3">
                    <label asp-for="Producto.Nombre" class="form-label fw-semibold"></label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-tag"></i></span>
                        <input asp-for="Producto.Nombre" class="form-control" placeholder="Ej: Teclado Mecánico RGB" />
                    </div>
                    <span asp-validation-for="Producto.Nombre" class="text-danger small"></span>
                </div>

                <div class="row">
                    <!-- Precio -->
                    <div class="col-md-6 mb-3">
                        <label asp-for="Producto.Precio" class="form-label fw-semibold"></label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input asp-for="Producto.Precio" type="number" step="0.01" class="form-control" placeholder="0.00" />
                        </div>
                        <span asp-validation-for="Producto.Precio" class="text-danger small"></span>
                    </div>

                    <!-- Cantidad -->
                    <div class="col-md-6 mb-3">
                        <label asp-for="Producto.Cantidad" class="form-label fw-semibold"></label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-stack"></i></span>
                            <input asp-for="Producto.Cantidad" type="number" min="0" class="form-control" placeholder="0" />
                        </div>
                        <span asp-validation-for="Producto.Cantidad" class="text-danger small"></span>
                    </div>
                </div>

                <hr class="my-4" />

                <!-- Botones de Acción -->
                <div class="d-flex justify-content-end gap-2">
                    <a asp-page="Index" class="btn btn-outline-secondary">Cancelar</a>
                    <button type="submit" class="btn btn-primary px-4 shadow-sm">
                        <i class="bi bi-check-lg me-1"></i>Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@section Scripts {
    <partial name="_ValidationScriptsPartial" />
}
`
  },
  {
    path: "Pages/Productos/Crear.cshtml.cs",
    filename: "Crear.cshtml.cs",
    language: "csharp",
    description: "PageModel Razor para validar y guardar un producto en SQL Server con manejo de errores",
    content: `using System;
using System.Threading.Tasks;
using EmpresaProductos.Data;
using EmpresaProductos.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace EmpresaProductos.Pages.Productos
{
    public class CrearModel : PageModel
    {
        private readonly IProductoRepository _repositorio;
        private readonly ILogger<CrearModel> _logger;

        public CrearModel(IProductoRepository repositorio, ILogger<CrearModel> logger)
        {
            _repositorio = repositorio;
            _logger = logger;
        }

        [BindProperty]
        public Producto Producto { get; set; } = new();

        public void OnGet()
        {
            // Inicialización de la vista
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            try
            {
                // Validación de unicidad de código antes de insertar
                if (await _repositorio.ExisteCodigoAsync(Producto.Codigo))
                {
                    ModelState.AddModelError("Producto.Codigo", $"El código '{Producto.Codigo}' ya está registrado en el sistema.");
                    return Page();
                }

                await _repositorio.GuardarAsync(Producto);
                TempData["MensajeExito"] = $"El producto '{Producto.Nombre}' (Código: {Producto.Codigo}) fue guardado con éxito.";
                return RedirectToPage("Index");
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Error de validación de negocio al guardar producto {Codigo}.", Producto.Codigo);
                ModelState.AddModelError(string.Empty, ex.Message);
                return Page();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el producto en la base de datos SQL Server.");
                ModelState.AddModelError(string.Empty, "Ocurrió un error inesperado al conectar con SQL Server: " + ex.Message);
                return Page();
            }
        }
    }
}
`
  },
  {
    path: "Pages/Productos/Editar.cshtml",
    filename: "Editar.cshtml",
    language: "razor",
    description: "Vista Razor para modificar nombre, precio y cantidad de un producto existente",
    content: `@page "{codigo}"
@model EmpresaProductos.Pages.Productos.EditarModel
@{
    ViewData["Title"] = "Modificar Producto";
}

<div class="container py-4" style="max-width: 720px;">
    <div class="mb-4">
        <a asp-page="Index" class="btn btn-link text-decoration-none ps-0">
            <i class="bi bi-arrow-left me-1"></i>Volver al Catálogo
        </a>
        <h1 class="h2 text-primary fw-bold mt-2">
            <i class="bi bi-pencil-square me-2"></i>Modificar Producto
        </h1>
        <p class="text-muted">Actualice la información del producto. El código actúa como identificador clave.</p>
    </div>

    @if (!ViewData.ModelState.IsValid && ViewData.ModelState[""]?.Errors.Count > 0)
    {
        <div class="alert alert-danger shadow-sm mb-4" role="alert">
            <i class="bi bi-exclamation-octagon-fill me-2"></i>
            <div asp-validation-summary="ModelOnly" class="d-inline"></div>
        </div>
    }

    <div class="card shadow-sm border-0">
        <div class="card-body p-4">
            <form method="post" novalidate>
                <!-- Código (Readonly) -->
                <div class="mb-3">
                    <label asp-for="Producto.Codigo" class="form-label fw-semibold"></label>
                    <div class="input-group">
                        <span class="input-group-text bg-light"><i class="bi bi-lock-fill"></i></span>
                        <input asp-for="Producto.Codigo" class="form-control bg-light" readonly />
                    </div>
                    <div class="form-text">El código no puede modificarse por ser la clave primaria del registro.</div>
                </div>

                <!-- Nombre -->
                <div class="mb-3">
                    <label asp-for="Producto.Nombre" class="form-label fw-semibold"></label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-tag"></i></span>
                        <input asp-for="Producto.Nombre" class="form-control" />
                    </div>
                    <span asp-validation-for="Producto.Nombre" class="text-danger small"></span>
                </div>

                <div class="row">
                    <!-- Precio -->
                    <div class="col-md-6 mb-3">
                        <label asp-for="Producto.Precio" class="form-label fw-semibold"></label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input asp-for="Producto.Precio" type="number" step="0.01" class="form-control" />
                        </div>
                        <span asp-validation-for="Producto.Precio" class="text-danger small"></span>
                    </div>

                    <!-- Cantidad -->
                    <div class="col-md-6 mb-3">
                        <label asp-for="Producto.Cantidad" class="form-label fw-semibold"></label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="bi bi-stack"></i></span>
                            <input asp-for="Producto.Cantidad" type="number" min="0" class="form-control" />
                        </div>
                        <span asp-validation-for="Producto.Cantidad" class="text-danger small"></span>
                    </div>
                </div>

                <hr class="my-4" />

                <!-- Botones -->
                <div class="d-flex justify-content-end gap-2">
                    <a asp-page="Index" class="btn btn-outline-secondary">Cancelar</a>
                    <button type="submit" class="btn btn-success px-4 shadow-sm">
                        <i class="bi bi-save me-1"></i>Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@section Scripts {
    <partial name="_ValidationScriptsPartial" />
}
`
  },
  {
    path: "Pages/Productos/Editar.cshtml.cs",
    filename: "Editar.cshtml.cs",
    language: "csharp",
    description: "PageModel Razor para cargar producto existente y aplicar cambios en SQL Server",
    content: `using System;
using System.Threading.Tasks;
using EmpresaProductos.Data;
using EmpresaProductos.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace EmpresaProductos.Pages.Productos
{
    public class EditarModel : PageModel
    {
        private readonly IProductoRepository _repositorio;
        private readonly ILogger<EditarModel> _logger;

        public EditarModel(IProductoRepository repositorio, ILogger<EditarModel> logger)
        {
            _repositorio = repositorio;
            _logger = logger;
        }

        [BindProperty]
        public Producto Producto { get; set; } = new();

        public async Task<IActionResult> OnGetAsync(string codigo)
        {
            if (string.IsNullOrEmpty(codigo))
            {
                return NotFound();
            }

            var productoExistente = await _repositorio.ObtenerPorCodigoAsync(codigo);
            if (productoExistente == null)
            {
                TempData["MensajeError"] = $"No se encontró el producto con código '{codigo}'.";
                return RedirectToPage("Index");
            }

            Producto = productoExistente;
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            try
            {
                await _repositorio.ModificarAsync(Producto);
                TempData["MensajeExito"] = $"El producto '{Producto.Nombre}' fue actualizado correctamente.";
                return RedirectToPage("Index");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al modificar producto {Codigo}.", Producto.Codigo);
                ModelState.AddModelError(string.Empty, "Error al guardar modificaciones: " + ex.Message);
                return Page();
            }
        }
    }
}
`
  },
  {
    path: "Pages/Productos/Eliminar.cshtml",
    filename: "Eliminar.cshtml",
    language: "razor",
    description: "Vista Razor con confirmación modal para eliminar un producto de forma segura",
    content: `@page "{codigo}"
@model EmpresaProductos.Pages.Productos.EliminarModel
@{
    ViewData["Title"] = "Eliminar Producto";
}

<div class="container py-4" style="max-width: 650px;">
    <div class="mb-4">
        <a asp-page="Index" class="btn btn-link text-decoration-none ps-0">
            <i class="bi bi-arrow-left me-1"></i>Volver al Catálogo
        </a>
    </div>

    <div class="card border-danger shadow-sm">
        <div class="card-header bg-danger text-white py-3">
            <h5 class="card-title mb-0">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación de Producto
            </h5>
        </div>
        <div class="card-body p-4">
            <p class="text-danger fw-semibold">
                ¿Está seguro de que desea eliminar permanentemente este producto del sistema?
            </p>

            <dl class="row mb-4">
                <dt class="col-sm-4 text-muted">Código:</dt>
                <dd class="col-sm-8 font-monospace fw-bold">@Model.Producto.Codigo</dd>

                <dt class="col-sm-4 text-muted">Nombre:</dt>
                <dd class="col-sm-8">@Model.Producto.Nombre</dd>

                <dt class="col-sm-4 text-muted">Precio:</dt>
                <dd class="col-sm-8 text-success fw-bold">@Model.Producto.Precio.ToString("C2")</dd>

                <dt class="col-sm-4 text-muted">Stock actual:</dt>
                <dd class="col-sm-8">@Model.Producto.Cantidad unidades</dd>
            </dl>

            <div class="alert alert-warning small mb-4">
                <i class="bi bi-info-circle me-1"></i> Esta acción ejecutará un comando <code>DELETE</code> en SQL Server y no se podrá recuperar.
            </div>

            <form method="post">
                <input type="hidden" asp-for="Producto.Codigo" />
                <div class="d-flex justify-content-end gap-2">
                    <a asp-page="Index" class="btn btn-outline-secondary">Cancelar</a>
                    <button type="submit" class="btn btn-danger px-4">
                        <i class="bi bi-trash-fill me-1"></i>Eliminar Definitivamente
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
`
  },
  {
    path: "Pages/Productos/Eliminar.cshtml.cs",
    filename: "Eliminar.cshtml.cs",
    language: "csharp",
    description: "PageModel Razor para eliminar producto con confirmación y control de excepciones",
    content: `using System;
using System.Threading.Tasks;
using EmpresaProductos.Data;
using EmpresaProductos.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace EmpresaProductos.Pages.Productos
{
    public class EliminarModel : PageModel
    {
        private readonly IProductoRepository _repositorio;
        private readonly ILogger<EliminarModel> _logger;

        public EliminarModel(IProductoRepository repositorio, ILogger<EliminarModel> logger)
        {
            _repositorio = repositorio;
            _logger = logger;
        }

        [BindProperty]
        public Producto Producto { get; set; } = new();

        public async Task<IActionResult> OnGetAsync(string codigo)
        {
            if (string.IsNullOrEmpty(codigo))
            {
                return NotFound();
            }

            var producto = await _repositorio.ObtenerPorCodigoAsync(codigo);
            if (producto == null)
            {
                TempData["MensajeError"] = $"No se encontró el producto con código '{codigo}'.";
                return RedirectToPage("Index");
            }

            Producto = producto;
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                await _repositorio.EliminarAsync(Producto.Codigo);
                TempData["MensajeExito"] = $"El producto '{Producto.Codigo}' fue eliminado exitosamente.";
                return RedirectToPage("Index");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar producto {Codigo}.", Producto.Codigo);
                TempData["MensajeError"] = "No se pudo eliminar el producto: " + ex.Message;
                return RedirectToPage("Index");
            }
        }
    }
}
`
  },
  {
    path: "Database/Script_SQLServer.sql",
    filename: "Script_SQLServer.sql",
    language: "sql",
    description: "Script de creación de base de datos SQL Server, tabla, claves primarias, índices y SPs",
    content: `-- =========================================================================
-- Script DDL para Base de Datos Empresarial en Microsoft SQL Server
-- =========================================================================

-- 1. Crear Base de Datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'EmpresaDB')
BEGIN
    CREATE DATABASE EmpresaDB;
END
GO

USE EmpresaDB;
GO

-- 2. Crear Tabla de Productos con restricciones de integridad
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Productos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Productos]
    (
        [Codigo] VARCHAR(20) NOT NULL,
        [Nombre] NVARCHAR(100) NOT NULL,
        [Precio] DECIMAL(18, 2) NOT NULL,
        [Cantidad] INT NOT NULL,
        [FechaRegistro] DATETIME2(7) NOT NULL DEFAULT GETDATE(),
        [FechaModificacion] DATETIME2(7) NULL,

        -- Restricción de Clave Primaria sobre Código
        CONSTRAINT [PK_Productos_Codigo] PRIMARY KEY CLUSTERED ([Codigo] ASC),

        -- Restricciones de Dominio (Check Constraints)
        CONSTRAINT [CK_Productos_PrecioPositivo] CHECK ([Precio] > 0),
        CONSTRAINT [CK_Productos_CantidadNoNegativa] CHECK ([Cantidad] >= 0)
    );

    -- Índice no agrupado para acelerar búsquedas por nombre de producto
    CREATE NONCLUSTERED INDEX [IX_Productos_Nombre] ON [dbo].[Productos] ([Nombre] ASC);
END
GO

-- 3. Datos de Prueba Iniciales (Semilla / Seed Data)
MERGE INTO [dbo].[Productos] AS Target
USING (VALUES
    ('PROD-001', N'Laptop Lenovo ThinkPad T14', 1250.00, 15),
    ('PROD-002', N'Monitor Dell 27 pulgadas 4K', 380.50, 24),
    ('PROD-003', N'Teclado Mecánico Inalámbrico', 95.00, 40),
    ('PROD-004', N'Mouse Ergonómico Bluetooth', 45.00, 8),
    ('PROD-005', N'Impresora Multifunción Láser', 290.00, 5)
) AS Source ([Codigo], [Nombre], [Precio], [Cantidad])
ON Target.[Codigo] = Source.[Codigo]
WHEN NOT MATCHED THEN
    INSERT ([Codigo], [Nombre], [Precio], [Cantidad], [FechaRegistro])
    VALUES (Source.[Codigo], Source.[Nombre], Source.[Precio], Source.[Cantidad], GETDATE());
GO

-- 4. Stored Procedure Opcional para Inserción con Transacción y Manejo de Errores
CREATE OR ALTER PROCEDURE [dbo].[sp_RegistrarProducto]
    @Codigo VARCHAR(20),
    @Nombre NVARCHAR(100),
    @Precio DECIMAL(18,2),
    @Cantidad INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [Codigo] = @Codigo)
        BEGIN
            THROW 50001, 'El código de producto ya existe.', 1;
        END

        INSERT INTO [dbo].[Productos] ([Codigo], [Nombre], [Precio], [Cantidad], [FechaRegistro])
        VALUES (@Codigo, @Nombre, @Precio, @Cantidad, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
`
  },
  {
    path: "appsettings.json",
    filename: "appsettings.json",
    language: "json",
    description: "Configuración de cadena de conexión a SQL Server y niveles de log",
    content: `{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\\\SQLEXPRESS;Database=EmpresaDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=30;MultipleActiveResultSets=true;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
`
  },
  {
    path: "Program.cs",
    filename: "Program.cs",
    language: "csharp",
    description: "Configuración de servicios, inyección de dependencias y middlewares de ASP.NET Core",
    content: `using EmpresaProductos.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// 1. Inyectar servicios para Razor Pages
builder.Services.AddRazorPages();

// 2. Registrar la conexión robusta y el repositorio de productos (Inyección de Dependencias)
builder.Services.AddSingleton<ConexionDB>();
builder.Services.AddScoped<IProductoRepository, ProductoRepository>();

var app = builder.Build();

// 3. Configurar pipeline HTTP y manejo global de excepciones
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthorization();

app.MapRazorPages();

app.Run();
`
  },
  {
    path: "Pages/Shared/_Layout.cshtml",
    filename: "_Layout.cshtml",
    language: "razor",
    description: "Plantilla principal Razor con Navbar de Bootstrap 5 y estilos corporativos",
    content: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewData["Title"] - Sistema de Productos</title>
    <!-- Bootstrap 5.3 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
</head>
<body class="bg-light d-flex flex-column min-vh-100">
    <!-- Navbar Corporativa -->
    <header>
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
            <div class="container-fluid px-4">
                <a class="navbar-brand fw-bold" asp-page="/Productos/Index">
                    <i class="bi bi-buildings me-2"></i>Empresa S.A. | Registro de Productos
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarContent">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link active" asp-page="/Productos/Index">
                                <i class="bi bi-boxes me-1"></i>Inventario
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" asp-page="/Productos/Crear">
                                <i class="bi bi-plus-circle me-1"></i>Nuevo Producto
                            </a>
                        </li>
                    </ul>
                    <span class="navbar-text text-white-50 small">
                        <i class="bi bi-hdd-network me-1"></i>Conectado a SQL Server Local
                    </span>
                </div>
            </div>
        </nav>
    </header>

    <!-- Contenido Principal -->
    <main role="main" class="flex-shrink-0">
        @RenderBody()
    </main>

    <!-- Pie de Página -->
    <footer class="footer mt-auto py-3 bg-white border-top text-center text-muted small">
        <div class="container">
            &copy; @DateTime.Now.Year - Empresa S.A. - Sistema de Gestión de Productos en C# Razor con SQL Server
        </div>
    </footer>

    <!-- Bootstrap 5 Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
`
  },
  {
    path: "EmpresaProductos.csproj",
    filename: "EmpresaProductos.csproj",
    language: "xml",
    description: "Archivo de proyecto .NET 8 con dependencias para SQL Server y Razor",
    content: `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>EmpresaProductos</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <!-- Cliente oficial de alto rendimiento para Microsoft SQL Server -->
    <PackageReference Include="Microsoft.Data.SqlClient" Version="5.2.0" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation" Version="8.0.2" />
  </ItemGroup>

</Project>
`
  },
  {
    path: "README.md",
    filename: "README.md",
    language: "markdown",
    description: "Guía paso a paso para ejecutar el proyecto en Visual Studio o VS Code",
    content: `# Sistema de Registro de Productos - C# con Razor y Bootstrap

Aplicación empresarial desarrollada en **C# (.NET 8)** con **ASP.NET Core Razor Pages**, interfaz moderna con **Bootstrap 5**, y persistencia local en **Microsoft SQL Server**.

## 🚀 Requisitos Previos
1. **.NET 8 SDK** ([Descargar](https://dotnet.microsoft.com/download/dotnet/8.0))
2. **Microsoft SQL Server** (LocalDB, Express o Developer Edition) o SQL Server en Docker.
3. **SQL Server Management Studio (SSMS)** o **Azure Data Studio**.

## 🛠️ Paso 1: Configurar la Base de Datos
1. Abra **SSMS** o Azure Data Studio y conéctese a su instancia de SQL Server (ej: \`localhost\\SQLEXPRESS\` o \`(localdb)\\MSSQLLocalDB\`).
2. Abra el archivo \`Database/Script_SQLServer.sql\` y ejecútelo.
   - Creará la base de datos \`EmpresaDB\`.
   - Creará la tabla \`Productos\` con claves primarias, validaciones y datos de prueba.

## ⚙️ Paso 2: Configurar la Cadena de Conexión
Revise el archivo \`appsettings.json\` y asegúrese de que la cadena coincida con su instancia:
\`\`\`json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost\\\\SQLEXPRESS;Database=EmpresaDB;Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=30;"
}
\`\`\`

## ▶️ Paso 3: Ejecutar la Aplicación
Desde la terminal en la raíz del proyecto:
\`\`\`bash
dotnet restore
dotnet run
\`\`\`
Abra su navegador en la dirección mostrada (generalmente \`https://localhost:5001\` o \`http://localhost:5000\`).
`
  }
];
