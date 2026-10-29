# ToolTrace V5.2 · Steep

## Grupos y subgrupos (29 de octubre de 2026)

Cada grupo puede contener subgrupos con nombre y color propios. Las herramientas actuales mantienen su clasificación sin migraciones; el subgrupo es opcional. Nueva/Editar herramienta, Asignar grupo de la selección múltiple y Añadir seriales incorporan los mismos selectores y creación de grupo/subgrupo RGB sin salir del formulario. Crear grupo independiente también permite elegir un padre.

El gestor organiza los subgrupos debajo de su grupo, con cantidades y acciones directas. Los filtros de Herramientas distinguen Todos, Sin subgrupo y cada subgrupo. La selección múltiple preselecciona la clasificación común y muestra el destino al guardar. Cambiar padre elimina únicamente una selección incompatible; no modifica nombres ni reportes.

Todas las hojas del Excel incluyen **Grupo** y **Subgrupo** en columnas contiguas. Excel de esta vista combina estos filtros y conserva el historial completo de las herramientas elegidas. Al eliminar una clasificación se puede elegir o crear el grupo y subgrupo de destino en el mismo formulario, conservando todos sus seriales e historiales. Los padres con subgrupos están protegidos contra eliminaciones que dejarían referencias huérfanas.

La cola conserva las asignaciones sin conexión, con comprobación de generaciones y pertenencia al sincronizar. Las reglas de Firestore de esta entrega deben publicarse antes del frontend; amplían la clasificación sin ampliar el acceso a datos ajenos. Validación: 182 pruebas automatizadas, once escenarios de navegador con almacenamiento aislado, Excel descargado y configuración/compilación de producción. Ver VERIFICACION-SUBGRUPOS.md.

## Indicadores y selección múltiple (29 de octubre de 2026)

El resumen incluye disponibilidad técnica, reparables/fuera de servicio, antigüedad de inspección y reparaciones recurrentes. Se calculan desde los registros del proyecto, con detalles por serial y periodos ajustables. Se renuevan cada minuto mientras el resumen está abierto y al recuperar foco/conexión; la caché y los cambios pendientes se identifican. No se guardan cifras simuladas ni se interpreta la antigüedad como vencimiento. Un proyecto vacío muestra — para disponibilidad.

Herramientas unifica OPERATIVA y CONFORME en **Operativa / conforme**, conservando los códigos históricos. Los nombres largos se recortan visualmente y permanecen completos en ficha/edición. Las acciones se mantienen visibles sin barra horizontal; tablet y móvil presentan tarjetas.

Las casillas permiten seleccionar herramientas o **Seleccionar todas** las que coincidan con los filtros. **Asignar grupo** abre un selector y permite crear un grupo RGB en el mismo diálogo. La selección se conserva al filtrar, muestra su total y se reinicia al cambiar de proyecto. Las asignaciones usan lotes de hasta 100 seriales con la cola existente y rechazan seriales eliminados/recreados antes de sincronizar. Se conservan nombres, reportes, eventos y agenda.

Validación: 160 pruebas automatizadas y once escenarios de navegador con almacenamiento aislado. Ver VERIFICACION-DASHBOARD-SELECCION.md para fórmulas, actualización y límites. No cambia el modelo de datos ni las reglas de Firebase.

## Búsqueda unificada, cantidad de eventos y colores RGB

En Herramientas, **Buscar por serial o nombre** consulta ambos campos con una sola casilla. Mantiene la normalización de seriales y permite buscar nombres sin distinguir tildes o mayúsculas. Grupo, fechas, estado y cantidad se combinan con esa consulta.

**Cantidad de eventos** admite mínimo y máximo inclusivos sobre el historial total guardado de cada herramienta: 0–0 muestra fichas sin eventos y 3–3 muestra exactamente tres. El rango de fechas selecciona herramientas con un evento dentro del periodo, sin cambiar el conteo total ni recortar el historial exportado. Las cantidades inválidas muestran un aviso. **Excel de esta vista** utiliza los mismos filtros y conserva todo el historial de los seriales seleccionados.

El panel de filtros se distingue mediante un fondo oscuro, controles claros, contador de filtros activos y número de resultados. **Limpiar filtros** restablece consulta, grupo, fechas, estado y cantidades. No se modifica ningún dato guardado al buscar o filtrar.

Los formularios de Nuevo/Editar grupo y Nuevo grupo dentro de Editar herramienta incorporan selector visual y canales **R, G y B**, de 0 a 255. Los valores se sincronizan con la muestra y las paletas. Se conserva el mismo color hexadecimal de seis dígitos en los datos, compatible con las reglas actuales de Firebase. Los valores RGB inválidos no se guardan.

Validación: 141 pruebas automatizadas y diez escenarios de navegador con datos aislados. Ver VERIFICACION-FILTROS-RGB.md. El dashboard se amplía en la actualización posterior descrita arriba.

## Extracción, nombres automáticos y diseño renovado

Las nuevas cargas de PDF, Excel, XLS, ODS y CSV reconocen más encabezados de serial y descripción, incluidas cabeceras divididas en varias filas y fragmentos de texto en columnas PDF. Se conserva la evidencia de celda/columna que vincula el nombre a su serial. La versión del extractor es 7: Reanalizar pendientes utiliza el lector nuevo; no se reescriben los reportes ya guardados.

Al guardar un reporte nuevo y válido, una descripción inequívoca de su tabla puede completar el nombre vacío de una herramienta existente. No reemplaza nombres actuales ni decisiones manuales, no cambia grupos/tipos, y conserva las reglas de estado técnico. No aplica retroactivamente al abrir la app ni al editar reportes antiguos. Si hay nombres contradictorios en la fecha más reciente, una fuente antigua, OCR o una asociación sin evidencia suficiente, se mantiene la revisión manual. Las herramientas nuevas conservan el comportamiento anterior de nombres desde BHA; las nuevas fuentes verificadas también pueden nombrarlas. La conformidad, los conteos y los campos obligatorios siguen validándose por separado.

El reporte conserva los seriales nombrados automáticamente y la procedencia se guarda con el evento. Las asignaciones se calculan dentro de la misma operación que guarda el reporte, también sin conexión; al sincronizar no se sustituyen nombres que otro dispositivo haya corregido.

Excel se procesa en un worker para no bloquear la interfaz. Se indexan las filas PDF, las propuestas de nombres y las consultas por serial; el estado técnico se calcula en una pasada. El progreso de lectura se actualiza sin reconstruir todas las tablas. El diseño añade superficies claras, controles de mayor contraste, tarjetas, navegación fija y animaciones breves; respeta movimiento reducido y la vista móvil. El modelo sigue siendo compatible con las reglas de Firebase existentes.

Verificación y límites: VERIFICACION-MOTOR-DISENO.md. No se promete reconocer cualquier formato o texto ilegible ni se utiliza un porcentaje de cobertura como garantía de exactitud.

## Edición y grupos sin salir de la pantalla (27 de octubre de 2026)

- En Nueva herramienta y Editar herramienta, selecciona un grupo existente o despliega **Nuevo grupo**. Indica nombre y color y pulsa **Crear grupo**. Se conserva el serial, nombre y tipo escritos; pulsa **Guardar herramienta** para completar la asignación.
- El grupo se crea al confirmar esa acción y se conserva aunque canceles después la edición de la herramienta. Los nombres vacíos o duplicados se muestran dentro del formulario. Si has escrito un grupo nuevo, debes crearlo o cancelar ese subformulario antes de guardar la herramienta.
- Nueva herramienta preselecciona el grupo que estés consultando. En Gestionar grupos, cada grupo ofrece **Ver herramientas**, **Nueva herramienta** y **Añadir seriales**, junto a las acciones anteriores. Ver herramientas muestra ese grupo sin filtros de búsqueda previos.
- Guardar, cancelar o pulsar Escape en una acción abierta desde el gestor regresa al listado de grupos. Las acciones de guardar/cancelar permanecen accesibles al desplazarse dentro del formulario.
- Se utilizan los repositorios y la cola sin conexión existentes. No cambia el modelo de datos ni requiere nuevas reglas de Firebase. Los originales y los historiales mantienen su funcionamiento.
- Verificación: 114 pruebas existentes aprobadas, compilación de producción y nueve escenarios de navegador con datos de demostración aislados. Consulta VERIFICACION-FLUJOS.md. Los cambios se publican con el flujo existente de GitHub Pages.

Aplicación web/PWA en español para asociar inspecciones, reparaciones y BHA a cada serial. HTML, CSS y JavaScript modular, Firebase Authentication y Firestore, con publicación estática en GitHub Pages.

## Carga de archivos y reconocimiento ampliado

### Trabajo sin conexión y sincronización

Abre la app e inicia sesión con conexión al menos una vez y visita los proyectos que vas a usar: sus datos se descargan a este dispositivo. Después puedes consultar historiales, cargar archivos disponibles en el dispositivo, guardar reportes, corregirlos, eliminar documentos individuales y modificar la agenda sin internet. Los datos válidos se aplican localmente y se guardan junto con una cola persistente en IndexedDB, separada por cuenta y proyecto.

Al volver la conexión con la app abierta, al reabrirla o volver a ella, se envían los cambios pendientes en orden. Varias ediciones del mismo reporte terminan en la última versión guardada. La app reintenta los envíos pendientes periódicamente; no vuelve a descargar todas las colecciones si no hay cambios pendientes. El indicador superior distingue **Por sincronizar**, **Sincronizado** y **Revisar sincronización**. Puedes pulsarlo para consultar o reintentar.

Los campos de un formulario se conservan como **borrador local**, incluso al editar un reporte existente. Al reabrirlo se recupera el borrador. Pulsa **Guardar reporte / Guardar cambios** para validarlo, aplicarlo al historial y ponerlo en la cola de sincronización: un borrador incompleto no se publica automáticamente. Borrar los datos del navegador también borra los cambios locales que todavía no se hayan enviado.

Si otro dispositivo editó el mismo reporte, la sincronización conserva la versión local y pide elegir entre **Conservar mis cambios locales** y **Usar la versión en línea**. La segunda opción descarta las ediciones pendientes de ese reporte; los otros documentos se conservan. Un envío confirmado cuya respuesta se pierda se reconoce por su identificador, sin repetir eventos. Los estados de herramientas y miembros BHA se siguen actualizando dentro de las transacciones del servidor.

Crear proyectos, vaciarlos y eliminarlos requiere conexión. No se puede vaciar un proyecto con cambios pendientes sin resolver. La sincronización necesita la sesión de la misma cuenta; si la app está cerrada, se retomará al abrirla con conexión. Los archivos originales continúan guardados localmente, sin almacenamiento remoto de archivos.

### Estados y autocompletado de inspección

**Cuerpo, PIN y BOX** ofrecen opciones para elegir o escribir con autocompletado: Conforme, No conforme / reparable y Fuera de servicio. PIN/BOX conservan también los códigos de los reportes NOV, como OK, TG, TD, TC, TP, ST, TW, RF y RB. Los valores existentes no se reemplazan por suposición. La conformidad final mantiene la lista de los tres estados técnicos del aplicativo. Empresa, código/versión, norma, descripción y conexión sugieren valores anteriores del proyecto actual; también admiten texto nuevo.

**Diferencias de cantidad:** si el texto indica 12 y se detectan 22 seriales, abre **Documentos → Completar**. En **Revisar cantidad de seriales** consulta la lista, el original y las páginas donde se leyó cada cantidad; después pulsa **Confirmar los 22 seriales detectados** y **Guardar reporte**. Es una confirmación para todo el documento y funciona con pendientes ya cargados, sin volver a subirlos. Se conservan el conteo leído y la lista confirmada con fecha. Si cambias los seriales o la cantidad original, se debe confirmar de nuevo. Esto no omite campos obligatorios, fechas ni controles de duplicados. Cantidades contradictorias nunca se resuelven tomando simplemente el número mayor.

**Cargar archivos** admite PDF, Excel XLSX/XLS, ODS, CSV/TSV, TXT e imágenes PNG/JPG/WebP/BMP. Se puede cargar una mezcla de formatos en un mismo lote. El original se conserva localmente antes de leerlo y su huella SHA-256 evita duplicados aunque se renombre. Las entidades, proyectos, estados e historial conservan su funcionamiento.

- PDF: mantiene los lectores TOTAL QC, NOV Tuboscope, SAIS y BHA. Las páginas con menos de 80 caracteres útiles pasan por OCR. Las tablas de otros emisores pueden reconocerse por sus encabezados y posición de las columnas.
- Excel/ODS/CSV: busca una cabecera con Serial y los campos del reporte; también reconoce fichas verticales de un serial con pares campo/valor. Acepta etiquetas en español e inglés, metadatos en filas anteriores, fechas Excel y seriales con ceros iniciales. Lee todas las hojas. No ejecuta fórmulas ni macros. Si un archivo mezcla familias o varios reportes incompatibles, queda pendiente y debe dividirse por reporte.
- Imágenes: OCR dentro del navegador, en español e inglés. Worker, WebAssembly e idiomas se publican con la app y se incluyen en la caché PWA; no se envía la imagen a terceros. La primera instalación descarga aproximadamente 33 MB adicionales. El tamaño afecta al tiempo de instalación y al espacio del dispositivo.
- TXT: reconoce reportes mediante títulos y etiquetas habituales. No admite Word, ZIP, archivos cifrados ni formatos binarios arbitrarios.
- Los documentos con texto estructurado y datos completos se guardan automáticamente. Los resultados de OCR se revisan una vez por reporte, no serial por serial: los caracteres de un serial no se corrigen por suposición. Los datos faltantes siguen sujetos a la matriz original; no se inventan empresas, fechas ni resultados.
- **Documentos → Reanalizar pendientes** reutiliza el original conservado. El texto de cada página PDF terminada queda almacenado, incluso si una página posterior falla; se reutiliza con la misma versión del lector. No se toca un reporte ya guardado.
- **Original** permite ver PDF/imágenes, consultar el texto de tablas y descargar el archivo. Los originales permanecen en el dispositivo de carga, sin R2 ni almacenamiento remoto de archivos.

Límites adicionales: 40 megapíxeles por imagen; 50 hojas, menos de 10.000 filas y 200 columnas por hoja, y 200.000 celdas por libro. Se mantienen 25 MB por archivo, 200 páginas por PDF y 100 seriales por reporte. No se garantiza extraer cualquier diseño: texto ilegible, tablas ambiguas o campos sin rótulo requieren completar datos. Las filas con seriales repetidos nunca se fusionan silenciosamente.

Fuentes de las bibliotecas: [SheetJS 0.20.3](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) y [Tesseract.js: instalación local](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md). `vite.config.js` copia los recursos OCR desde las dependencias; publicar solo `src/` sin compilar no habilita OCR.

## Proyectos independientes

El selector **Proyecto** permite cambiar de lugar de trabajo y **Nuevo proyecto** crea un espacio vacío. Cada proyecto tiene documentos, herramientas por serial, eventos, BHA, agenda, pendientes y PDFs locales propios. Dashboard, edición y Excel trabajan sobre el proyecto seleccionado. El mismo serial o PDF puede existir en proyectos diferentes; dentro de cada proyecto se mantienen los controles de duplicados. El nombre del proyecto aparece en el archivo Excel descargado.

Los datos anteriores se muestran como **Proyecto principal**, conservando sus rutas y archivos originales. No se copian ni se borran para activar esta función. Los nuevos proyectos usan `users/{uid}/projects/{projectId}` con las colecciones operativas dentro. El proyecto principal conserva `users/{uid}/{collection}` para que las sesiones anteriores sigan siendo compatibles. Los documentos de proyecto guardan solo id, nombre y fecha de creación.

**Eliminar datos** vacía únicamente el proyecto seleccionado y conserva los demás. **Eliminar proyecto** elimina también el nombre del selector, con doble confirmación. El proyecto principal se puede vaciar y permanece como espacio inicial. No se incluye todavía traslado de documentos entre proyectos ni renombrado.

Actualiza `firestore.rules` antes de desplegar esta versión. Los proyectos siguen siendo privados por cuenta y requieren correo verificado. Los PDFs permanecen en el navegador donde se cargaron, separados también por proyecto.

## Publicar en producción

Sigue [PRODUCCION.md](PRODUCCION.md) para configurar Firebase y publicar mediante GitHub Pages. Resumen contiene solo indicadores y gráfico; Herramientas y Documentos tienen sus propias pantallas. Todos los campos del Excel están centrados horizontal y verticalmente, con bordes finos en cada celda.

## Reconocimiento de formatos de inspección

- TOTAL QC FT-END-003: mantiene la lectura por celdas, incluyendo textos en varias líneas.
- SAIS-OP-F-53R Heavy Weight Premium: lee las columnas verticales de cuerpo, PIN, caja y condición final; interpreta OP, R y FS según la leyenda del formato. Conserva reporte, OIT, versión, vigencia, fecha, norma, descripción, conexión y datos de la fila. La fecha de emisión permanece vacía si no está publicada.
- NOV Tuboscope Heavyweight: usa la hoja de recuento como lista de seriales y enlaza las hojas de mediciones y observaciones por serial. Las páginas de maquinado requerido pertenecen a la inspección, no crean reparaciones realizadas. La conformidad se obtiene de los resultados PIN/BOX únicamente cuando concuerdan con los conteos del resumen y sus códigos son reconocidos. Si hay discrepancias o códigos desconocidos, el documento queda por completar. El código/versión del formato y el cuerpo individual permanecen vacíos si el reporte no los informa.
- Otros diseños con texto seleccionable: clasificación por títulos y extracción adicional mediante etiquetas habituales en español e inglés. Esto no garantiza reconocer cualquier disposición; los datos ambiguos o insuficientes quedan pendientes. Los PDF escaneados se leen con OCR local. Las lecturas por imagen requieren una revisión del reporte completo antes de guardar.
- **Documentos → Reanalizar pendientes** vuelve a leer juntos los PDFs disponibles de ese proyecto, previa confirmación de que reemplazará los datos pendientes. Los reportes ya guardados se conservan. Se debe usar el dispositivo donde se cargaron los originales.
- **Historial por herramienta** ordena todos los seriales alfabéticamente, independientemente del grupo. Cada fila conserva los eventos de esa herramienta del más antiguo al más reciente, en bloques horizontales. Las hojas de inspección incluyen también los nuevos datos del formato.

Publica las reglas actualizadas de `firestore.rules` para permitir los reportes Tuboscope que no publican un código de formato: `firebase deploy --only firestore:rules --project tooltracker-d3140`. Usa la cuenta propietaria de ese proyecto; si tu sesión de la herramienta pertenece a otra cuenta, ejecuta `firebase login:add` y selecciona la cuenta correcta con `--account` en el despliegue.

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

- **Eliminar**, en cada fila de Documentos o dentro de un reporte, quita únicamente ese documento del proyecto activo. Pide escribir ELIMINAR antes de confirmar. Elimina sus eventos y sus miembros BHA, recalcula el estado de las herramientas con los eventos restantes y retira las fichas que ya no tengan historial. Conserva los demás reportes y la agenda; elimina también el PDF y el pendiente locales de ese dispositivo. El borrado de un reporte guardado en Firebase es transaccional, requiere conexión y rechaza revisiones obsoletas. Una vez eliminado, el mismo PDF puede volver a cargarse.
- **Colores:** azul para inspecciones, verde para reparaciones y violeta para BHA, compartidos entre etiquetas, gráfico y calendario. Los indicadores usan superficies suaves de esos colores; las acciones principales usan verde petróleo y los avisos conservan ámbar o rojo según su función. Se mantienen el diseño Steep, los logotipos, los textos de estado y la preferencia de movimiento reducido.
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

La extracción combina PDF.js, lectura de tablas y OCR local con Tesseract.js en español e inglés. No utiliza IA externa. Los escaneos requieren revisión del reporte completo antes de guardar. La validación automática no puede garantizar que cualquier formato nuevo se interprete correctamente. El PDF y la evidencia por página se conservan para consultar y corregir.

## Edición e integridad

Las ediciones reemplazan los eventos del reporte dentro de una transacción y mantienen el PDF original. Si cambia un serial, se reasocia el evento y se recalculan tanto la ficha anterior como la nueva. Si la ficha anterior queda sin eventos, se retira. Cambiar una fecha también recalcula la condición técnica según todo el historial.

Cada reporte tiene una revisión. Si otra sesión lo modifica, una edición basada en la revisión anterior se rechaza y la interfaz solicita abrir de nuevo el reporte. La fecha original de incorporación del evento se conserva cuando se corrige.

La clave de duplicado lógico es tipo + empresa + número de reporte + serial + fecha (+ pozo en BHA). Un cambio de nombre del archivo no permite repetir un PDF. Un PDF idéntico sigue bloqueado después de corregir sus datos. Las ediciones no pueden crear eventos equivalentes a los de otro documento. La interfaz permite eliminar documentos individuales, con confirmación del alcance y escritura de ELIMINAR. No se conserva un historial completo de versiones anteriores de los campos corregidos.

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


## Catálogo y extracción ampliada (octubre de 2026)

En **Herramientas → Nuevo grupo** define nombre y color. Usa **Nueva herramienta** para registrar serial, tipo y grupo; **Editar** permite reasignar un serial existente. Los grupos pertenecen al proyecto actual. La asignación manual prevalece sobre la clasificación automática HWDP y se conserva en nuevas importaciones, fichas, filtros y Excel. Registrar una herramienta no inventa un evento ni un estado técnico.

**Eliminar** pide escribir ELIMINAR. Quita el serial y sus eventos; un reporte compartido conserva los demás seriales y su original, y actualiza cantidad/revisión. Si no quedan seriales, se elimina ese reporte. La agenda se conserva. El conteo declarado del original queda auditado junto con los seriales excluidos. Los grupos, registros y eliminaciones también se guardan sin conexión y se sincronizan por orden al volver a internet. Si otro dispositivo modifica el historial antes de borrar, se recupera la versión en línea para revisarla y confirmar de nuevo.

Documentos muestra junto a Eliminar la fecha real del evento. Si hay varias fechas, muestra el intervalo y el número de fechas; el detalle completo aparece al acercar el cursor. No utiliza la fecha de subida como sustituto. El gráfico diferencia inspecciones en azul, reparaciones en naranja y BHA en rosa, conservando trazos distintos.

El lector PDF reconstruye letras sueltas mediante sus coordenadas y separa correctamente las columnas Cuerpo/PIN/BOX/Conformidad de tablas TOTAL QC anchas. La versión de extracción se incrementó: los pendientes se pueden volver a analizar desde sus originales. Los reportes ya guardados se conservan y pueden corregirse desde Editar. Los formatos desconocidos o datos dudosos siguen requiriendo revisión; no se garantiza reconocer automáticamente cualquier diseño futuro.

Las nuevas colecciones `toolGroups` y `syncReceipts` requieren publicar `firestore.rules` antes del frontend. Los recibos permiten reintentar una eliminación ya aceptada sin borrar una carga posterior del mismo serial. Se incluyen en el vaciado de proyecto. No contienen archivos ni credenciales.


## Gestionar grupos, asignar seriales y filtrar herramientas

En **Herramientas → Gestionar grupos** puedes:

- **Editar** el nombre y el color de los grupos creados. La identidad del grupo y los historiales se conservan.
- **Añadir seriales** escribiendo o pegando hasta 100 valores separados por líneas, espacios, comas o punto y coma. Los repetidos se unifican; los seriales existentes conservan tipo y estado técnico, y se trasladan al grupo seleccionado. Los nuevos se crean sin estado técnico.
- **Eliminar grupo**: exige escribir ELIMINAR y elegir otro grupo al que trasladar sus herramientas. Conserva todos los reportes y eventos.
- **Borrar todos los seriales**: muestra la cantidad, pide una primera confirmación y después escribir ELIMINAR. Elimina las herramientas confirmadas y sus eventos; mantiene el grupo vacío y la agenda. Los reportes compartidos conservan los seriales ajenos, con cantidad y revisión actualizadas una sola vez. Los reportes sin seriales restantes y sus originales locales se eliminan al completar la sincronización.

Los grupos iniciales HWDP y Otras admiten asignación de seriales y vaciado; su nombre y existencia se conservan. Las acciones afectan únicamente al proyecto abierto y también quedan guardadas sin conexión. Si un historial o grupo cambió en otro dispositivo, la sincronización permite recuperar la versión actual para revisar y confirmar de nuevo. Los borrados masivos se limitan a una transacción de hasta 475 cambios; si se supera el límite, divide los cambios en grupos más pequeños.

Los filtros **Eventos desde**, **Eventos hasta** y **Estado actual** se combinan con grupo y búsqueda. Los extremos de fecha son inclusivos y seleccionan herramientas que tengan al menos un evento (inspección, reparación o BHA) dentro del rango. El estado es el técnico actual, aunque su evento sea posterior al rango. Una herramienta manual sin eventos no aparece al filtrar por fechas. **Limpiar filtros** restablece toda la selección. **Excel de esta vista** respeta los filtros y conserva el historial completo de cada herramienta seleccionada.

Esta versión amplía las reglas de grupos para la versión de pertenencia y los recibos de sincronización; publica `firestore.rules` antes del frontend. La asignación y el traslado leen las fichas actuales en transacción para conservar su estado e historial. Los recibos impiden repetir un vaciado ya aceptado cuando se pierde la respuesta.


## Calendario con tarjetas y lectura de libros BHA

El calendario mensual muestra tarjetas por reporte y fecha, con tipo, referencia y cantidad de seriales. Una tarjeta de reporte abre su detalle; una tarjeta agendada abre la cita para editarla. Los eventos programados tienen borde discontinuo. Se muestran tres tarjetas por día y el botón de eventos adicionales abre el detalle completo del día. En pantallas pequeñas se puede desplazar el calendario horizontalmente, manteniendo legibles las tarjetas.

El lector de Excel BHA reconoce encabezados con celdas combinadas, número BHA, locación/pozo, fase, fecha y columnas de medidas con unidades. Propietario y otros datos se rellenan únicamente desde la celda combinada que realmente cubre esa fila. Conserva ceros iniciales y seriales numéricos; las fechas cortas dd-mm-aa del formato BHA se interpretan como 20aa, validando la fecha resultante. Lee valores guardados de fórmulas sin ejecutarlas.

Los límites de filas/columnas se aplican al contenido real, evitando rechazar un libro por columnas vacías que conservan formato. Cuando hay una tabla principal de componentes BHA, las hojas de inventario o tally sin contexto de evento completo no heredan sus metadatos. Las hojas omitidas aparecen en un detalle del formulario y siempre se conservan en el original. Otros reportes reconocidos del libro se mantienen y se detecta la mezcla de tipos para revisión.

Cada registro conserva hoja y celda del serial. Las celdas con varios identificadores, alias o formatos ambiguos se conservan completas y se señalan para revisión; no se unen ni separan por suposición. Las filas de componentes con medidas pero sin serial también impiden el guardado automático. El formulario mantiene las correcciones manuales y permite completar el reporte una sola vez. La versión de extracción es 4: usa Reanalizar pendientes para volver a leer archivos ya cargados; los documentos guardados no se reemplazan automáticamente.


## Estados de Cuerpo, PIN y BOX

Las sugerencias de los campos Cuerpo, PIN y BOX, tanto en inspección como en reparación donde estén presentes, contienen exactamente tres opciones: **Conforme**, **No conforme/reparable** y **Fuera de servicio**. No se añaden códigos históricos ni OK como opciones. Los campos siguen admitiendo escritura: OK, ok o variantes de mayúsculas/espacios se muestran como Conforme al salir del campo.

La lectura automática normaliza la misma equivalencia después de combinar texto y tablas, y el guardado vuelve a aplicarla para cubrir formularios antiguos, importaciones y cambios sin conexión. Las vistas y el Excel interpretan los valores históricos OK como Conforme sin reescribir el original. La evidencia del documento se conserva. Otros códigos desconocidos se conservan tal como aparecen: no se convierten en conformidad por suposición. La equivalencia se aplica a la pieza; no inventa la conformidad final de una inspección ni cambia la regla de reparación emitida = herramienta operativa.

La versión de extracción es 5. Los pendientes anteriores se pueden reanalizar desde el original; los reportes ya guardados permanecen disponibles para edición. No cambian las reglas de Firebase ni las entidades.


## Nombres de herramientas (actualización preparada)

- Cada serial conserva su identidad y admite un `toolName` opcional (hasta 160 caracteres), independiente de grupo y tipo. Puede editarse desde **Herramientas → Editar**. Varias herramientas pueden compartir nombre.
- El filtro **Nombre** combina búsqueda sin distinguir tildes/mayúsculas con serial, grupo, fechas y estado. Excel de esta vista respeta la selección y conserva el historial completo.
- Los BHA nuevos leen **Descripción de la herramienta** en tablas Excel, incluidas celdas combinadas reales, y en PDF con columnas reconocidas. Las herramientas nuevas reciben el nombre explícito al guardar el BHA; las existentes se completan mediante revisión.
- **Completar nombres desde BHA** revisa los eventos ya guardados y vuelve a leer los originales disponibles en este dispositivo, sin guardar ni revalidar los documentos. Solo relaciona descripciones con seriales ya validados en el mismo reporte y usa la fecha validada. No usa el nombre de archivo para adivinar herramientas.
- La vista previa usa la descripción disponible del BHA más reciente. Omite nombres existentes, seriales sin coincidencia exacta y nombres distintos con la misma fecha más reciente. Se eligen las propuestas antes de guardar; se puede seleccionar todo. Una cantidad inicial, como `(5)`, se omite del nombre propuesto.
- La confirmación modifica exclusivamente metadatos de nombre en `tools`: no cambia `documents`, `events`, `bha`, `bhaMembers`, grupos, agenda ni el estado técnico. No es una migración de documentos. Los nombres se guardan también sin conexión y sincronizan en orden.
- Se verifica la generación del serial, el nombre previo y la revisión del BHA antes del cambio remoto. Si cambiaron, se pide revisar la versión en línea. Los reintentos de una misma operación son idempotentes.
- Los originales permanecen en el navegador donde se subieron. Si faltan, la vista previa lo indica; abrir desde ese dispositivo o nombrar manualmente. No se borra ni reemplaza la base de datos. No requiere cambiar las reglas actuales de Firestore.
