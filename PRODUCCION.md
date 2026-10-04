# Publicar ToolTrace en GitHub Pages y Firebase

Esta carpeta contiene el proyecto completo. El sitio se publica en GitHub Pages; Firebase gestiona las cuentas y la información de los reportes. No necesitas Firebase Hosting.

## 1. Preparar el equipo

Instala Node.js 22.12 o superior, Git y GitHub Desktop. Descomprime el proyecto y abre una terminal dentro de la carpeta que contiene `package.json`.

```powershell
npm ci
npm test
```

## 2. Crear Firebase

1. Entra en https://console.firebase.google.com/ y crea un proyecto dedicado a ToolTrace. Anota su **ID de proyecto**.
2. En Configuración del proyecto → General → Tus apps, registra una aplicación web con el botón **</>**.
3. Copia los valores del objeto `firebaseConfig` a `src/config.js`, conservando `export const firebaseConfig` y `export const useEmulators = false`. No pegues los imports del ejemplo de Firebase.
4. En Authentication → Sign-in method, habilita **Correo electrónico/contraseña**.
5. En Firestore Database, crea la base de datos predeterminada en **modo producción**. Elige su ubicación antes de confirmar. No uses reglas abiertas de modo prueba.

La configuración web es pública y puede formar parte del código. Las reglas de Firestore protegen los datos. Nunca agregues claves privadas ni archivos de cuentas de servicio al repositorio. [Configuración oficial de Firebase](https://firebase.google.com/docs/web/setup).

## 3. Publicar las reglas de la base de datos

Desde la carpeta del proyecto:

```powershell
npm install -g firebase-tools
firebase login
firebase deploy --only firestore --project TU_ID_REAL_DE_PROYECTO
```

Reemplaza `TU_ID_REAL_DE_PROYECTO` por el ID anotado. El comando publica los archivos `firestore.rules` y `firestore.indexes.json` incluidos. No ejecutes `firebase init`: los archivos ya están preparados. Las reglas requieren un usuario conectado con correo verificado y separan los datos por cuenta. [Herramientas oficiales de Firebase](https://firebase.google.com/docs/cli).

## 4. Comprobar la aplicación

```powershell
npm run check:production
npm run build
npm run preview
```

La comprobación impide publicar con campos básicos vacíos o emuladores activados; no comprueba por sí sola la conexión remota. Para probar el acceso desde el equipo, añade `127.0.0.1` y `localhost` en Authentication → Settings → Authorized domains.

Abre la dirección que muestra la terminal. Registra una cuenta, verifica el correo y vuelve a entrar. Prueba un PDF, su historial y la descarga de Excel. Los datos de demostración no se transfieren automáticamente a tu cuenta Firebase.

## 5. Subir a GitHub

1. En GitHub Desktop selecciona **File → Add local repository** y elige esta carpeta. Si aún no es un repositorio, usa el enlace **create a repository here**, sin crear una carpeta adicional.
2. Comprueba que `package.json`, `src`, `public`, `tests`, las reglas y `.github/workflows/pages.yml` están en la raíz. No subas PDFs, exportaciones con datos personales, `node_modules` ni `dist`.
3. Crea el primer commit y usa **Publish repository**. Puedes llamarlo `tooltrace`. Para GitHub Pages con GitHub Free, utiliza un repositorio público.
4. Comprueba que la rama publicada se llama **main**, porque el flujo incluido se ejecuta sobre esa rama.

## 6. Activar GitHub Pages

1. En el repositorio de GitHub abre **Settings → Pages**.
2. En **Build and deployment → Source**, selecciona **GitHub Actions**.
3. Abre **Actions → Deploy GitHub Pages → Run workflow**, selecciona `main` y ejecuta. Si una ejecución anterior falló antes de activar Pages, vuelve a ejecutarla.
4. Espera a que termine correctamente. El flujo instala dependencias, ejecuta pruebas, comprueba la configuración de producción y publica la aplicación compilada.
5. Copia la dirección que aparece en Settings → Pages, normalmente `https://TU_USUARIO.github.io/tooltrace/`.

El proyecto ya incluye el flujo de publicación y rutas relativas para funcionar bajo el nombre del repositorio. Cada nuevo cambio enviado a `main` vuelve a publicar el sitio. [Configuración oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 7. Autorizar el dominio y probar producción

1. En Firebase → Authentication → Settings → Authorized domains, añade **TU_USUARIO.github.io**, sin `https://` ni `/tooltrace/`.
2. Abre la URL pública. Registra una cuenta de prueba y verifica su correo.
3. Carga un reporte de inspección, reparación y BHA. Comprueba la asociación por serial, edición, calendario y Excel. Resumen debe mostrar únicamente los indicadores y el gráfico.
4. Recarga la página: los reportes deben seguir registrados. Vuelve a cargar el mismo PDF: debe reconocerse como duplicado.
5. Prueba recuperación de contraseña y la instalación de la PWA en un navegador compatible.

## Qué se conserva y dónde

Firestore guarda herramientas, documentos, eventos, BHA, miembros y agenda. Cada usuario tiene sus propios datos; todavía no hay un inventario compartido entre cuentas.

Los PDFs originales se conservan en el navegador del dispositivo donde se cargaron, asociados a la cuenta. No se almacenan en Firebase ni se sincronizan entre dispositivos. Borrar los datos del navegador elimina esas copias locales. Mantén los originales. Cambiar de localhost al sitio publicado requiere cargar allí los PDFs; si sus registros ya están en Firestore, se reconocerán sin duplicarlos.

Los PDFs escaneados que no contienen texto pueden necesitar completar sus datos manualmente. Esta versión no incluye OCR remoto ni IA externa.

## Si algo falla

- **Configuración pendiente en Actions:** completa `src/config.js`, guarda el cambio y envíalo a `main`.
- **Acceso denegado al guardar:** verifica el correo de la cuenta y confirma que publicaste las reglas en el proyecto correcto.
- **Dominio no autorizado:** revisa el dominio en Authentication, sin rutas ni protocolo.
- **Pantalla antigua tras actualizar:** recarga y acepta la actualización de la PWA; no borres el almacenamiento si necesitas conservar los PDFs locales.
- **Publicación fallida:** abre la ejecución en Actions y revisa el primer paso que aparece en rojo.

No se ha realizado todavía un despliegue remoto desde este proyecto: falta conectar el repositorio y la configuración real de Firebase.
