# GitHub Updater — Guía para desarrolladores

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [Git](https://git-scm.com/)

## Configuración inicial

```bash
git clone https://github.com/Alowster/github-updater.git
cd github-updater
npm install
npm start
```

Usa `npm run dev` para arrancar con las DevTools abiertas.

## Estructura del proyecto

```
github-updater/
├── src/
│   ├── main.js          # Proceso principal de Electron (IPC, API de GitHub, lógica de auto-update)
│   ├── preload.js       # Puente seguro renderer ↔ main
│   └── renderer/
│       └── index.html   # Interfaz de usuario (JS vanilla, sin framework)
├── assets/
│   ├── icon.png         # Icono de la app (256×256)
│   ├── icon.ico         # Icono para Windows
│   └── tray-icon.png    # Icono de la bandeja del sistema (16×16 o 32×32)
├── apps-config/
│   └── example-apps.json
└── package.json
```

## Compilar

```bash
npm run build         # Windows portable (.exe)
npm run build:local   # Windows, salida en /dist sin empaquetar
npm run build:linux   # Linux (.AppImage)
```

Los archivos compilados se guardan en `dist/`.

## Publicar un release

Los releases se publican mediante el workflow de GitHub Actions en `.github/workflows/release.yml`.
Lánzalo manualmente desde **Actions → Release → Run workflow**.

El workflow:
1. Hace checkout del repo en `windows-latest`
2. Ejecuta `npm ci` y `npm run build`
3. Sube el `.exe` como artefacto

Para publicar directamente en GitHub Releases usa `npm run release` (requiere el secreto `GH_TOKEN` con permiso `contents: write`).

## Self-update

La app puede actualizarse a sí misma. El repositorio destino se define en `src/main.js`:

```js
const UPDATER_REPO = 'Alowster/github-updater'; // ya configurado
```

Adjunta el `.exe` compilado como asset en cada GitHub Release y la app lo detectará y ofrecerá la actualización automáticamente.

## Iconos

Coloca en `assets/`:

- `icon.png` — 256×256px, fondo transparente
- `icon.ico` — icono para Windows (convierte el PNG en [icoconvert.com](https://icoconvert.com))
- `tray-icon.png` — 16×16 o 32×32px

## Formato de assets en un release de GitHub

Para que la descarga automática funcione, los releases deben tener archivos binarios adjuntos:

```
Release v2.0.0
├── mi-app-v2.0.0.exe      ← Ejecutable Windows
├── mi-app-v2.0.0.zip      ← Versión portable
└── Source code (zip)      ← generado automáticamente por GitHub
```

Si no hay assets adjuntos, el updater abre la página del release en el navegador.

## Dependencias

| Paquete | Uso |
|---|---|
| `electron` | Shell de la app de escritorio |
| `electron-builder` | Empaquetado y publicación |
| `electron-store` | Configuración y datos de apps persistentes |
| `node-fetch` | Peticiones a la API de GitHub |

## Formato de versiones

La app compara versiones usando el tag del GitHub Release. Formatos soportados:

- `v1.0.0` ✅
- `v2.3.1` ✅
- `1.0.0` ✅ (el prefijo `v` es opcional)
