# Verificación de carga multiformato · 14 de octubre de 2026

- 53 pruebas automatizadas aprobadas: conservación de seriales y ceros iniciales, XLSX/XLS, CSV delimitado con comillas y saltos de línea, fechas Excel, tablas por coordenadas, rechazo de familias mezcladas, repetidos y revisión de lecturas OCR. Incluye las pruebas anteriores de estado, historial, edición, proyectos y eliminación individual.
- Compilación de producción y comprobación de configuración Firebase aprobadas.
- Prueba de navegador Chrome en un espacio de demostración desechable: carga masiva de los dos nuevos PDF de referencia, 31 eventos guardados automáticamente; carga de CSV y rechazo del mismo archivo renombrado; imagen PNG y PDF escaneado con texto generado para la prueba, lectura OCR local, revisión del reporte y guardado correcto.
- El navegador no solicitó recursos OCR a jsDelivr ni al proveedor de idiomas. Worker, núcleo e idiomas se sirvieron desde el mismo sitio de la app. No se enviaron documentos a servicios externos.
- Los originales y la evidencia permanecen separados por cuenta/proyecto. El texto de las páginas PDF terminadas se conserva para retomar el reconocimiento con la misma versión del lector. Los originales de referencia y los archivos de prueba no forman parte del repositorio público.
- Las reglas de Firestore no requieren cambios para esta ampliación: se conservan las familias y la matriz de campos vigente. La comprobación de guardado se hizo en demostración local; no se incorporaron datos de prueba a la cuenta real.

Alcance: PDF, XLSX, XLS, ODS, CSV, TSV, TXT, PNG, JPG/JPEG, WebP y BMP. Las pruebas OCR no garantizan todos los diseños, calidades o escrituras. Word, archivos cifrados y binarios arbitrarios no están implementados. Los escaneos requieren revisión del reporte completo y los datos faltantes nunca se completan por suposición.
