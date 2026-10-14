# Guardado local, sincronización y estados de inspección

Verificado el 14 de octubre de 2026:

- 73 pruebas automatizadas aprobadas, incluidas 13 de guardado y sincronización offline.

- Cola y copia local en IndexedDB, por usuario/proyecto; las operaciones y el estado local se guardan en la misma transacción de almacenamiento.
- Pruebas de varias ediciones offline, nueva carga y cambio de serial antes de conectar, respuesta perdida después del envío, conflicto con otra sesión, selección local/remota, agenda, eliminación individual, edición durante un envío y aislamiento de cuenta/proyecto. Se verifica también la conservación de un formulario antiguo y que las revisiones periódicas sin cambios no descarguen todas las colecciones.
- El adaptador Firebase conserva sus transacciones y revisión de documentos. Los reportes incluyen identificador de operación para reconocer una confirmación repetida. Las lecturas remotas de sincronización se solicitan al servidor; un fallo de red no sustituye el estado local por una caché remota incompleta.
- Prueba en Chrome con IndexedDB real y PWA: opciones de inspección, borrador de reporte existente editado sin conexión, recarga de la app sin internet, recuperación del borrador, guardado, persistencia de la cola tras recargar y envío de la última versión al reconectar. Vista móvil sin desbordamientos ni errores de página.
- El backend de esta prueba de sincronización fue simulado. No se crearon usuarios ni datos de prueba en Firebase de producción. Las pruebas automatizadas del repositorio ejercitan reintentos, revisiones, integridad de eventos y decisiones ante conflictos; no equivalen a una prueba integral contra la cuenta Firebase real.

Condiciones: iniciar sesión y descargar el proyecto una vez con conexión. Guardar aplica un formulario validado a la copia local; el autoguardado del formulario mantiene un borrador y no publica datos incompletos. Sincroniza con la app abierta o al reabrirla con conexión. Los originales de archivos siguen siendo locales. Crear/vaciar/eliminar proyectos requiere conexión. No hace falta cambiar las reglas de Firestore de esta versión.
