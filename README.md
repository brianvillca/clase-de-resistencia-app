# Clase de Resistencia App

Aplicación interactiva desarrollada con **React**, **Vite**, **TypeScript** y el SDK de **Google Gemini** (`@google/genai`).

---

## 📋 Requisitos previos

El proyecto utiliza paquetes que exigen una versión moderna de Node.js:

* **Node.js**: `>= 20.19.0` (recomendado **Node.js 22 LTS**)
* **npm**: `>= 9.0.0`
* **Git**

> **Nota:** Si estás usando Node.js 18 o inferior, la instalación fallará con errores de `EBADENGINE`. Se recomienda usar un gestor como `nvm` o actualizar Node.js globalmente.

---

## ⚙️ Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/brianvillca/clase-de-resistencia-app.git
cd clase-de-resistencia-app
```

### 2. Verificar la versión de Node.js

Asegurate de estar usando Node 20 o superior:

```bash
node -v
# Debe mostrar v20.x.x o v22.x.x
```

Si usás `nvm`:
```bash
nvm install 22
nvm use 22
```

### 3. Instalar las dependencias

Ejecutá el gestor de paquetes de Node:

```bash
npm install
```

> **En caso de problemas previos:** Si venías de un intento con una versión anterior de Node, limpiá la caché y los artefactos residuales antes de reinstalar:
> ```bash
> rm -rf node_modules package-lock.json
> npm cache clean --force
> npm install
> ```

---

## 🚀 Ejecución en desarrollo

Una vez completada la instalación y configuración de variables:

```bash
npm run dev
```

El servidor local se levantará por defecto en `http://localhost:3000` (o el puerto configurado en `vite.config.ts`).

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo local con recarga rápida (HMR). |
| `npm run build` | Compila y optimiza el proyecto TypeScript/React para producción en `dist/`. |
| `npm run preview` | Previsualiza localmente el build de producción generado. |
