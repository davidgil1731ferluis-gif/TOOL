# ToolTrace V5.2 · Steep

Aplicación web/PWA en español para asociar inspecciones, reparaciones y BHA a cada serial. HTML, CSS y JavaScript modular, Firebase Authentication y Firestore, con publicación estática en GitHub Pages.

## Publicar en producción

Sigue [PRODUCCION.md](PRODUCCION.md) para configurar Firebase y publicar mediante GitHub Pages. Resumen contiene solo indicadores y gráfico; Herramientas y Documentos tienen sus propias pantallas. Todos los campos del Excel están centrados horizontal y verticalmente, con bordes finos en cada celda.

## Calendario, historial y limpieza

- **Excel:** la primera hoja, Historial por herramienta, contiene una sola fila por serial. Después de los datos generales, cada evento ocupa su propio bloque de columnas (Evento 1, Evento 2, etc.), de la fecha más antigua a la más reciente. Serial y grupo permanecen inmóviles al desplazarse horizontalmente. Incluye serial, grupo, tipo, empresa, referencia de reporte, campos de los formatos y PDF/páginas de origen. Usa el filtro de Serial para seguir una herramienta. Conserva las hojas por formato para consultas específicas. Los eventos futuros no se mezclan con el historial realizado.
- **Calendario:** navega por meses, selecciona un día y consulta reportes registrados. Un reporte con varios seriales se agrupa por tipo y fecha. Agendar evento permite título, fecha, tipo, serial opcional y notas. Las citas pueden editarse o cancelarse. Se almacenan separadamente en `scheduledEvents` y no crean eventos técnicos, herramientas ni cambios de estado. La agenda no envía notificaciones externas.
- **Dashboard:** tres líneas muestran inspecciones, reparaciones y BHA. Unidad: reportes por fecha (documento + tipo + día), no seriales. Si un reporte contiene varias fechas de reparación aparece en cada día correspondiente. Las citas futuras se excluyen. Hay una tabla accesible con los valores.
- **Eliminar datos**, en Documentos: primera confirmación del alcance y segunda confirmación escribiendo ELIMINAR. Elimina las cinco colecciones operativas y `scheduledEvents` de la cuenta activa, además del archivo local de PDFs y pendientes de esa cuenta en este dispositivo. No elimina Authentication ni datos de otros usuarios. No se ejecuta un borrado por actualizar la app.
- En Firebase el borrado requiere conexión, usa lotes de hasta 400 documentos y un bloqueo `settings/maintenance` que impide nuevas escrituras durante la operación. Si falla parcialmente, conserva el bloqueo y muestra un mensaje para repetir Eliminar datos hasta completar. Los archivos locales de otros dispositivos quedan fuera del alcance; evita reanudar cargas pendientes allí tras una limpieza global.
- **Actualizar las reglas Firestore incluidas es obligatorio** antes de utilizar V4 con Firebase: autorizan agenda y borrado por propietario y aplican el bloqueo de mantenimiento. La configuración real de Firebase sigue pendiente en este proyecto.

## Excel y grupos de herramientas

- En **Documentos → Excel** descarga toda la información guardada: historial horizontal por serial, inspecciones, reparaciones y BHA. La primera hoja contiene una fila por herramienta con bloques cronológicos; las hojas por formato contienen una fila por evento con los datos completos, PDF de origen y páginas. Si hay documentos pendientes, añade una hoja **Por completar** con lo detectado y los campos faltantes.
- En **Herramientas**, selecciona Todas, HWDP u Otras. **Excel de esta vista** respeta el grupo y la búsqueda de serial; incluye el historial completo de esos seriales. La exportación funciona sin conexión con los datos disponibles en el dispositivo.
- HWDP se asigna al serial normalizado que empieza por NHA o termina en N. Los demás quedan en OTRAS. La regla se aplica a datos existentes y a nuevas cargas; corregir un serial recalcula su grupo.
- El Excel es una copia para consulta. Para corregir el historial, usa **Editar** en la app y descarga otro Excel. No se importan cambios desde Excel.
- Los identificadores se conservan como texto, incluidos ceros iniciales; las fechas válidas guardadas son fechas de Excel. Los pendientes conservan fechas tal como se detectaron para mostrar también valores inválidos.
- La vista Documentos permite filtrar Guardados y Por completar. El flujo visual, las animaciones y la respuesta al arrastrar PDFs respetan la preferencia de movimiento reducido del dispositivo.
- El archivo `ToolTrace-seriales-referencia.xlsx` entregado junto al proyecto refleja los nueve PDFs originales, no modificaciones posteriores de la cuenta.

## Carga y edición

- Carga individual o masiva con **validación y guardado automático**. Al finalizar, los reportes completos aparecen en Documentos y en el resumen por serial. No hay casillas de confirmación individual.
- Solo los archivos con datos faltantes, inconsistencias o errores quedan **Por completar**. Todos sus PDFs y cambios pendientes se conservan localmente.
- **Editar** permite cambiar los datos de un reporte guardado, incluyendo fechas y seriales. Una sola acción guarda todo el reporte. Se recalculan los historiales y los estados afectados; se actualizan también la cabecera y los miembros BHA.
- Los campos BHA son: número, pozo, fase, fecha, serial, propietario, diámetro externo, diámetro interno, fishing neck y longitud. Se eliminaron tipo BHA, componente, conexión, longitud parcial/acumulada, torque, pesos y observaciones. Inspección y reparación conservan sus campos.
- El archivo local conserva el PDF desde que termina de copiarse, antes de procesarlo. Las cargas interrumpidas se reanudan al entrar. Los archivos ya guardados y los pendientes se reconocen por SHA-256, aunque cambie su nombre.
- Menos textos, datos comunes del reporte en un solo bloque y filas de edición plegables.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+.

```sh
npm ci
npm run dev
```

Abra la dirección indicada. **Explorar demostración local** permite usar todo el flujo en este navegador sin configurar una cuenta. Ese modo conserva los datos en localStorage y los PDFs/pendientes en IndexedDB. La sesión de demostración se mantiene al recargar la pestaña; cerrar sesión no borra documentos.

```sh
npm test
npm run build
npm run preview
```

`dist/` contiene la versión compilada. Use un servidor HTTP; no abra archivos mediante `file://`. La PWA requiere HTTPS o localhost. Después de la primera carga permite consultar datos locales y leer PDFs sin conexión. Guardar o editar datos de Firebase requiere conexión.

## Firebase

1. Cree un proyecto Firebase y registre una aplicación Web.
2. Copie su configuración pública en `src/config.js`. No coloque claves privadas ni cuentas de servicio.
3. Habilite **Email/Password** en Authentication. Configure las políticas de contraseña y las plantillas de correo.
4. Agregue `localhost` y `USUARIO.github.io` en Authentication → Authorized domains.
5. Cree una base **Cloud Firestore Standard, Native mode** y publique `firestore.rules`.

```sh
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore
```

6. Registre y verifique una cuenta. La aplicación y las reglas exigen correo verificado.

**Actualización desde V1:** vuelva a publicar las reglas de Firestore. Las reglas anteriores no permiten modificar los reportes guardados. Los datos existentes se conservan; los documentos y herramientas adquieren sus índices de eventos y revisiones al guardarlos con V2. La base IndexedDB se actualiza de versión 1 a 2 conservando los PDFs.

Los datos se aíslan en `users/{uid}/tools`, `documents`, `events`, `bha` y `bhaMembers`. Cada cuenta tiene su archivo independiente. Las reglas restringen el acceso al propietario y comprueban campos críticos; el motor completo de validación y cálculo de estados se ejecuta en el cliente. Esta versión no implementa organizaciones ni inventario compartido.

Para emuladores, configure `useEmulators = true` y ejecute `npx firebase-tools emulators:start --only auth,firestore` con Firebase CLI y Java compatibles. Restaure `false` para producción.

Fuentes: [Firebase Web](https://firebase.google.com/docs/web/setup), [Authentication](https://firebase.google.com/docs/auth/web/password-auth), [transacciones](https://firebase.google.com/docs/firestore/manage-data/transactions), [reglas](https://firebase.google.com/docs/firestore/security/get-started).

## GitHub Pages

1. Suba el contenido de esta carpeta a la raíz de su repositorio, incluyendo `.github/` y `package-lock.json`. No suba `node_modules/`.
2. En Settings → Pages, seleccione **GitHub Actions**.
3. El workflow incluido ejecuta pruebas, compila y publica `dist/` con cada cambio en `main`, o manualmente.
4. Autorice el dominio en Firebase y abra `https://USUARIO.github.io/REPOSITORIO/`.
5. Instale desde el menú del navegador. En iPhone: Compartir → Añadir a pantalla de inicio.

La base relativa permite publicar en subdirectorios. El service worker conserva archivos de la aplicación, no respuestas de Firebase. Al instalar actualizaciones no se borran el archivo local ni los datos del usuario.

## Validación automática

El flujo es: conservar PDF → extraer texto → clasificar → detectar plantilla → separar seriales → extraer campos → validar matriz → guardar un documento completo en una transacción → recalcular resumen.

Se comprueban campos requeridos, seriales válidos y no repetidos, fechas reales, emisión posterior o igual a inspección, coherencia de conformidad, medidas válidas y datos comunes del reporte. Si el PDF declara cantidad de componentes, se compara con lo detectado. Los registros no se guardan parcialmente cuando hay errores.

Los nueve PDFs de referencia producen **121 eventos**, con validación automática: TOTAL QC 2/1/9/4, Tuboscope 6/11 y BHA 24/24/40.

- TOTAL QC FT-END-003: lectura por coordenadas de las celdas cuerpo, PIN, BOX, conformidad final y hallazgos. Une textos partidos, como «No» y «Conforme/Reparable», dentro de la misma celda.
- NOV Tuboscope: fecha Repair Date de cada fila, distinta de la cabecera; empresa, reporte, orden, PIN/BOX y maquinado.
- BHA: columna de seriales para códigos numéricos, con guiones o espacios; cabecera y medidas que pueden ubicarse en una sola celda. Los campos opcionales ambiguos quedan vacíos.

Esta es extracción determinista con PDF.js. Los documentos escaneados sin texto quedan conservados y pendientes; todavía no hay OCR ni IA externa. La validación automática no puede garantizar que cualquier formato nuevo se interprete correctamente. El PDF y la evidencia por página se conservan para consultar y corregir.

## Edición e integridad

Las ediciones reemplazan los eventos del reporte dentro de una transacción y mantienen el PDF original. Si cambia un serial, se reasocia el evento y se recalculan tanto la ficha anterior como la nueva. Si la ficha anterior queda sin eventos, se retira. Cambiar una fecha también recalcula la condición técnica según todo el historial.

Cada reporte tiene una revisión. Si otra sesión lo modifica, una edición basada en la revisión anterior se rechaza y la interfaz solicita abrir de nuevo el reporte. La fecha original de incorporación del evento se conserva cuando se corrige.

La clave de duplicado lógico es tipo + empresa + número de reporte + serial + fecha (+ pozo en BHA). Un cambio de nombre del archivo no permite repetir un PDF. Un PDF idéntico sigue bloqueado después de corregir sus datos. Las ediciones no pueden crear eventos equivalentes a los de otro documento. No existe borrado de documentos desde la interfaz ni un historial completo de versiones anteriores de los campos corregidos.

Máximos: 25 MB y 200 páginas por PDF; 100 seriales por reporte. Una edición que exceda 480 escrituras se rechaza y debe dividirse en cambios menores.

## Estados

- Reparación emitida: **OPERATIVA**.
- Inspección: **CONFORME**, **NO_CONFORME_REPARABLE** o **NO_CONFORME_FUERA_SERVICIO**.
- BHA: no modifica la condición técnica. Un serial que solo aparece en BHA queda **SIN_ESTADO_TECNICO**.

La fecha técnica determina el estado. Cargar un reporte antiguo no sustituye un evento posterior. Para eventos técnicos de igual fecha, se desempata por incorporación e ID; las correcciones conservan la incorporación original.

## Persistencia y alcance

Firebase guarda los datos estructurados. Los PDFs originales y los pendientes se guardan en **este dispositivo y este origen web**, incluso cuando no se pueden procesar. No se eliminan al cerrar sesión. Si el navegador concede almacenamiento persistente, la app lo utiliza. Borrar los datos del navegador, cambiar de dominio/puerto o de dispositivo no traslada los PDFs. Al volver a cargar un PDF ya registrado en otro dispositivo se conserva aquí sin repetir sus eventos.

No hay R2 ni almacenamiento remoto real de archivos. `src/adapters/extensions.js` mantiene las interfaces para incorporarlos después. Los PDFs operativos de referencia no se incluyen en el ZIP ni en el sitio público.

La aplicación carga las colecciones del usuario en memoria. Para volúmenes grandes, el siguiente desarrollo debe incorporar consultas paginadas, almacenamiento remoto y validación en backend.

## Estructura

- `src/engine/`: classifier, templateDetector, textExtractor, recordSplitter, serialExtractor, serialNormalizer, fieldExtractor, matrixValidator, confidenceEngine, toolMatcher, eventCreator, statusEngine e historyEngine; helpers de lectura por coordenadas y pipeline.
- `src/adapters/repository.js`: validación del documento, identidad, plan de creación/edición y repositorio local.
- `src/adapters/firebase.js`: autenticación, transacciones e índices de eventos para recalcular historiales concurrentes.
- `src/adapters/pdfStore.js`: archivo persistente de PDFs y cola recuperable.
- `firestore.rules`: acceso por cuenta verificada y edición de entidades.

Consulte `VERIFICACION.md` para las pruebas y los límites de verificación de esta entrega.

## Estilo Factory (4.1)
Fondo #101010, navegación superior, paneles neutros, tarjeta clara principal, tipografía de peso 400 y etiquetas monoespaciadas. Geist/Geist Mono con alternativas del sistema para funcionar sin descargar fuentes. Los acentos naranja y verde se reservan para datos y estados. Animaciones de 180 ms y respeto por movimiento reducido. Sin cambios de datos ni reglas Firebase respecto a V4.


## V5: historial horizontal y estilo Steep

- El Excel asigna una fila por herramienta, con estado actual, fecha técnica y total de eventos. Cada bloque horizontal conserva fecha, tipo, emisor, reporte, todos los campos de los formatos y origen del PDF. Los espacios sin evento quedan vacíos; no se mezclan datos de herramientas distintas. Los filtros de grupo y búsqueda se respetan.
- La exportación añade tantos bloques como el historial más largo de la vista. Rechaza explícitamente un historial que supere las 16.384 columnas de Excel, sin recortar eventos. El ejemplo de referencia tiene 77 filas y 86 columnas para 121 eventos.
- Estilo Steep: fondo blanco, títulos serif regulares, tarjetas de 24 px, botones redondeados, grises neutros y un acento melocotón por pantalla. Los gráficos usan marrón, negro y gris, con trazos distintos para diferenciar las series.
- Signifier y Sohne se declaran con alternativas locales Georgia y system-ui; no se incluyen archivos de fuentes comerciales ni se requieren descargas para usar la app sin conexión.
- `ToolTrace-historial-horizontal.xlsx` refleja los nueve PDFs de referencia. Para obtener las correcciones más recientes de tu cuenta, exporta desde la app.


## V5.1: gráfico interactivo e historial esencial

- Al acercarse a un punto del gráfico, tocarlo o enfocarlo con teclado aparece una tarjeta con los reportes de esa fecha, empresa/pozo y seriales. Cada referencia abre el reporte. Cierra con la X, Escape o pulsando fuera del gráfico. Las tarjetas con varios reportes se desplazan verticalmente.
- El eje X utiliza hasta cinco fechas equidistantes a lo largo del periodo; son marcas del eje, no necesariamente días con eventos. Los puntos mantienen la fecha real. La tabla inferior permite consultar los valores exactos.
- La hoja principal del Excel conserva una fila por serial y bloques horizontales cronológicos. Cada bloque tiene seis columnas: Fecha, Tipo, Empresa, Reporte, Resultado y Detalles clave. Se omiten estado actual, conteos, identificadores internos, versiones y metadatos técnicos en esta vista. No se añade un resumen duplicado. Las hojas Inspecciones, Reparaciones y BHA mantienen los datos completos y fuentes.
- Detalles clave: cuerpo/PIN/BOX/hallazgos de inspección; orden/PIN/BOX/maquinado de reparación; pozo/fase en BHA. Observaciones y otros campos permanecen en las hojas detalladas. El ejemplo contiene 77 herramientas y 121 eventos en 20 columnas principales.
- Entradas suaves de paneles, respuesta de botones y calendario, dibujo de líneas y tarjetas animadas, conservando Steep. Se desactivan con la preferencia de movimiento reducido.
