# Búsqueda, filtros de eventos y color RGB

## Cambios

- Consulta única por serial o nombre, con coincidencia en cualquiera de los dos campos. Los parámetros antiguos search/name del motor se conservan para compatibilidad; la interfaz y el Excel filtrado utilizan query.
- Mínimo/máximo de eventos inclusivos, validación de enteros no negativos y rango coherente. Usa todos los eventos guardados del serial, incluidas inspecciones, reparaciones y BHA. La selección por fechas no altera ese conteo.
- Mismos criterios en la pantalla y en Excel; se conserva el historial completo de los seriales seleccionados. Se indexan herramientas y eventos y se reutiliza el resultado del filtro al generar las hojas.
- Panel de filtros separado de resultados, fondo de mayor contraste, contador de filtros y de herramientas, y estado vacío con opción de limpiar.
- RGB visual y numérico en creación/edición de grupos y creación integrada en herramientas. Paleta, RGB y hexadecimal sincronizados, con validación de 0 a 255. Persistencia hexadecimal original, sin cambios de esquema ni reglas de Firebase.
- La validación del formulario lee su atributo id para evitar que el campo oculto llamado id oculte la propiedad nativa del formulario.

## Validación

- 141 pruebas automatizadas aprobadas: las 131 anteriores y diez pruebas nuevas sobre búsqueda combinada, cantidades, rangos, exportación y RGB.
- Compilación de producción completada.
- Diez escenarios de navegador con datos de demostración aislados: consulta por ambos campos y tildes, cantidad total y fechas, descarga real de Excel, contraste del panel, rango inválido/cero/limpieza, sincronización RGB-paleta-selector, recuperación RGB al editar, grupo integrado sin pérdida de campos/historial, vista móvil y recarga sin conexión.
- Se comprueban documentos, eventos, miembros BHA y agenda sin cambios al usar filtros, y también al asignar el nuevo grupo a la herramienta de prueba.
- Sin errores JavaScript en los escenarios.

Las pruebas no modifican cuentas ni datos de producción. Las propuestas de KPI no se incorporan en este cambio; requieren seleccionar el alcance, periodo y umbrales deseados.
