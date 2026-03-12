# GitHub Updater 🔄

Una toolbox de escritorio para monitorizar y actualizar tus aplicaciones de GitHub automáticamente.

## ✨ Características

- **Toolbox minimalista** — ventana compacta con todas tus apps y su estado
- **Bandeja del sistema** — consume mínimos recursos cuando está minimizada
- **Verificación automática** — comprueba nuevas versiones por GitHub Releases en intervalos configurables
- **Auto-actualización** — descarga automáticamente los binarios cuando detecta una versión nueva
- **Self-updating** — el propio updater se actualiza a sí mismo
- **Notificaciones** — avisa cuando hay una actualización disponible
- **Soporte para apps Python y ejecutables** — descarga el release asset correspondiente

## 🚀 Instalación

### Requisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [Git](https://git-scm.com/)

### Pasos

```bash
# 1. Clonar o descargar el repositorio
git clone https://github.com/TU-USUARIO/github-updater.git
cd github-updater

# 2. Instalar dependencias
npm install

# 3. Arrancar en modo desarrollo
npm start

# 4. (Opcional) Compilar ejecutable
npm run build        # Windows (.exe)
npm run build:linux  # Linux (.AppImage)
```

## ⚙️ Configuración

### Token de GitHub (recomendado)

Sin token, la API de GitHub tiene un límite de **60 peticiones/hora**. Con token personal: **5000 peticiones/hora**.

1. Ve a [GitHub Settings > Tokens](https://github.com/settings/tokens/new)
2. Crea un token con scope `repo` (para repos privados) o sin scopes (solo públicos)
3. Pégalo en la pestaña **Ajustes** de la app

### Añadir tus aplicaciones

1. Haz clic en **+ App**
2. Rellena:
   - **Nombre**: nombre que quieres mostrar
   - **Repositorio**: `tu-usuario/nombre-repo`
   - **Versión instalada**: la versión que tienes ahora (p.ej. `v1.2.0`)
   - **Icono**: un emoji representativo (opcional)
   - **Auto-update**: actívalo si quieres descargas automáticas

### Formato de versiones

La app usa los **tags de GitHub Releases** para comparar versiones. Asegúrate de que tus releases usen el formato semver:
- `v1.0.0` ✅
- `v2.3.1` ✅  
- `1.0.0` ✅ (sin `v` también funciona)

## 📁 Estructura del proyecto

```
github-updater/
├── src/
│   ├── main.js          # Proceso principal de Electron
│   ├── preload.js       # Puente seguro renderer ↔ main
│   └── renderer/
│       └── index.html   # Interfaz de usuario
├── assets/
│   ├── icon.png         # Icono de la app (256x256)
│   ├── icon.ico         # Icono para Windows
│   └── tray-icon.png    # Icono de la bandeja (16x16 o 32x32)
├── apps-config/
│   └── example-apps.json
└── package.json
```

## 🎨 Iconos

Para que la app tenga iconos correctos, añade en la carpeta `assets/`:
- `icon.png` — 256×256px, fondo transparente
- `icon.ico` — para Windows (puedes convertir el .png con [icoconvert.com](https://icoconvert.com))
- `tray-icon.png` — 16×16 o 32×32px para la bandeja del sistema

## 🔧 Self-update

Para que el updater se actualice a sí mismo, edita en `src/main.js`:

```js
const UPDATER_REPO = 'TU_USUARIO/github-updater'; // ← Cambia esto
```

Y crea releases en GitHub con el ejecutable compilado como asset.

## 📝 Estructura de un release en GitHub

Para que la descarga automática funcione, tus releases deben tener **assets** adjuntos:

```
Mi Release v2.0.0
├── mi-app-v2.0.0-setup.exe    ← Ejecutable Windows
├── mi-app-v2.0.0.zip          ← Versión portable
└── Source code (zip)
```

Si no hay assets, el updater abrirá la página del release en el navegador.

## 🐛 Solución de problemas

| Problema | Solución |
|----------|----------|
| "GitHub API error: 403" | Has superado el rate limit. Añade un token en Ajustes |
| "GitHub API error: 404" | El repositorio no existe o es privado. Usa un token con scope `repo` |
| No aparece en la bandeja | Reinicia la app. En Windows puede estar oculta en la barra de tareas |
| La versión no se detecta | Comprueba que el tag del release sea formato `v1.0.0` |

## 📄 Licencia

MIT
