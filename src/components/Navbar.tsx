import React from 'react';
import { DatabaseConfig } from '../types';

interface NavbarProps {
  currentTab: 'index' | 'crear' | 'codigo' | 'sql';
  onSelectTab: (tab: 'index' | 'crear' | 'codigo' | 'sql') => void;
  dbConfig: DatabaseConfig;
  onOpenDbConfig: () => void;
  productCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  dbConfig,
  onOpenDbConfig,
  productCount,
}) => {
  return (
    <nav className="navbar navbar-expand-lg sticky-top border-b border-[#2A2A2A] bg-[#121212] shadow-xl" id="main-enterprise-navbar" style={{ backgroundColor: '#121212' }}>
      <div className="container-fluid px-3 px-md-4">
        <a
          href="#index"
          id="nav-brand-link"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('index');
          }}
          className="navbar-brand d-flex align-items-center gap-3 text-white text-decoration-none"
        >
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <i className="bi bi-box-seam-fill fs-6"></i>
          </div>
          <div>
            <div className="lh-1 fs-5 font-semibold tracking-tight text-white">Empresa S.A.</div>
            <small className="font-mono text-gray-400" style={{ fontSize: '0.70rem' }}>
              Razor Pages &bull; SQL Server Local
            </small>
          </div>
        </a>

        <button
          className="navbar-toggler border-[#333] text-gray-400"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarEnterpriseContent"
          aria-controls="navbarEnterpriseContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          id="btn-navbar-toggler"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarEnterpriseContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1.5 ms-lg-3">
            <li className="nav-item">
              <button
                type="button"
                id="nav-tab-index"
                onClick={() => onSelectTab('index')}
                className={`nav-link btn btn-link text-start d-flex align-items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  currentTab === 'index'
                    ? 'bg-[#1E1E1E] text-white border border-[#333] shadow-sm font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <i className={`bi bi-table ${currentTab === 'index' ? 'text-emerald-400' : 'text-gray-500'}`}></i>
                <span>Catálogo (Index.cshtml)</span>
                <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded text-xs font-mono">
                  {productCount}
                </span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                id="nav-tab-crear"
                onClick={() => onSelectTab('crear')}
                className={`nav-link btn btn-link text-start d-flex align-items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  currentTab === 'crear'
                    ? 'bg-[#1E1E1E] text-white border border-[#333] shadow-sm font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <i className={`bi bi-plus-circle-fill ${currentTab === 'crear' ? 'text-emerald-400' : 'text-gray-500'}`}></i>
                <span>Registrar Producto</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                id="nav-tab-codigo"
                onClick={() => onSelectTab('codigo')}
                className={`nav-link btn btn-link text-start d-flex align-items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  currentTab === 'codigo'
                    ? 'bg-[#1E1E1E] text-white border border-[#333] shadow-sm font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <i className="bi bi-file-earmark-code-fill text-amber-400"></i>
                <span>Código C# &amp; Razor</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                id="nav-tab-sql"
                onClick={() => onSelectTab('sql')}
                className={`nav-link btn btn-link text-start d-flex align-items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  currentTab === 'sql'
                    ? 'bg-[#1E1E1E] text-white border border-[#333] shadow-sm font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <i className="bi bi-terminal-fill text-sky-400"></i>
                <span>Consola SQL</span>
              </button>
            </li>
          </ul>

          {/* Estado de Conexión SQL Server */}
          <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            <button
              type="button"
              id="btn-sql-server-status"
              onClick={onOpenDbConfig}
              className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-mono ${
                dbConfig.simulateErrors
                  ? 'bg-red-950/40 text-red-400 border border-red-800/60'
                  : 'bg-[#1A1A1A] hover:bg-[#222] text-gray-300 border border-[#333]'
              }`}
              title="Configurar y probar conexión a SQL Server"
            >
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  dbConfig.simulateErrors ? 'bg-red-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
              ></span>
              <span className="text-gray-400">SQL:</span>
              <span className="text-emerald-400">{dbConfig.server}</span>
              <span className="px-2 py-0.5 bg-black/40 text-gray-300 rounded border border-[#333] text-[10px]">
                {dbConfig.database}
              </span>
              <i className="bi bi-gear-fill text-gray-500 hover:text-white ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
