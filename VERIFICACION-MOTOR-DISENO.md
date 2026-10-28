# Extracción, nombres y diseño

## Alcance y conservación de información

- Extractor 7: alias de encabezados en español/inglés, cabeceras de hasta tres filas, metadatos desplazados, nombres desde celdas combinadas reales y cabeceras PDF fragmentadas.
- Nombres automáticos únicamente al aceptar reportes nuevos con evidencia de tabla vinculada al mismo serial. Se conservan nombre actual, decisión manual, grupo, tipo y regla de estado. No se ejecutan migraciones al abrir, correcciones de seriales por suposición ni reescritura de reportes antiguos.
- Si el nombre es contradictorio, pertenece a una fuente anterior a la última fecha relevante, es genérico, se cambió respecto a su evidencia o procede de OCR, no se utiliza para completar automáticamente una herramienta existente.
- Se mantiene la revisión de OCR por reporte, la validación matricial, los conteos y los controles de duplicados.
- Una edición con descripción intacta conserva su evidencia previa. Las ediciones de reportes antiguos no rellenan nombres de herramientas existentes.
- La sincronización vuelve a calcular la asignación con el estado actual de la transacción: un nombre corregido desde otro equipo prevalece.
- Sin nuevas reglas de Firestore ni servicios de IA externos. Los originales siguen locales.

## Motor e interfaz

- Lectura de libros en worker dedicado y liberación de recursos al terminar o fallar. El original se conserva ante errores.
- Agrupación espacial de fragmentos PDF; índices por serial para nombres, filtros y conteos; cálculo lineal del último evento técnico; índice de celdas combinadas BHA; progreso sin reconstrucción completa de la página por cada aviso.
- Nueva hoja de estilos que conserva la estructura y funciones anteriores: tarjetas, contraste, colores, navegación fija, botones y formularios, diálogo de grupos y distribución móvil.
- Animaciones de entrada y respuesta a acciones; desactivación con movimiento reducido. Cambio de pestaña abre la sección desde arriba.

## Verificación

- 131 pruebas automatizadas aprobadas: las 114 existentes y 17 nuevas de extracción, nombres, conservación de datos y sincronización.
- Casos XLSX, XLS y ODS con cabeceras divididas, seriales numéricos con ceros, metadatos desplazados, alias ingleses, cabeceras repetidas, columnas duplicadas y fragmentos PDF.
- Pruebas de no sobrescritura de nombres aprobados o decisiones manuales, conflicto de descripciones, reportes antiguos, OCR, caché pendiente, recarga y corrección remota.
- Navegador con archivos XLSX y PDF generados como muestras de control: lectura real mediante worker y PDF.js, asignación automática, conservación de registros históricos, duplicados, edición de grupos, vista móvil y movimiento reducido. Datos de demostración aislados; no se prueban escrituras sobre cuentas de producción.
- Compilación de producción y comprobación posterior del sitio publicado.

## Medición local

Mediana de tres ejecuciones, mismos datos y resultados comprobados como idénticos:

| Función | Muestra | Antes | Después |
|---|---|---:|---:|
| Agrupación de líneas PDF | 12.000 fragmentos | 41,26 ms | 9,77 ms |
| Propuestas de nombres | 1.500 herramientas / 15.000 eventos | 632,41 ms | 22,31 ms |

Son mediciones de estas funciones con muestras locales, no una garantía del tiempo total de carga de cualquier archivo. Los PDFs escaneados siguen dependiendo de la calidad de imagen y del OCR. El frontend conserva el aviso de tamaño de algunos paquetes JavaScript al compilar; no impide generar la aplicación.
