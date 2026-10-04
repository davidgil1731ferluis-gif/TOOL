# Verificación de ToolTrace V5

## Resultado

- Historial XLSX validado con un lector independiente: 121 filas ordenadas del 17/07/2026 al 22/09/2026, fechas de Excel y seriales de texto.
- Agenda: crear, editar y recargar conserva la cita. Calendario móvil de 390 px sin desbordamiento de página.
- Dashboard: tres líneas y agrupación por reporte/fecha; las citas se excluyen de la serie técnica.
- Borrado probado únicamente en una sesión aislada: cancelar no elimina datos, una frase incorrecta no continúa, ELIMINAR limpia las entidades y agenda. La cuenta permanece abierta.
- Firebase real y las reglas de mantenimiento no se han ejecutado contra un proyecto configurado. Deben desplegarse las reglas incluidas para habilitar las nuevas funciones.


- Excel descargado desde la app para todos los seriales y para HWDP, también sin conexión. Archivos abiertos con lector XLSX independiente: fechas tipadas, ceros de versión conservados, seriales de texto, paneles inmóviles y detalle completo. No se ejecutó Microsoft Excel de escritorio.
- 77 herramientas: 50 HWDP y 27 OTRAS. 121 eventos: 16 inspecciones, 17 reparaciones, 88 registros BHA. Verificados filtros de grupo, búsqueda y estado de documento.
- Vista móvil sin desbordamiento de página y movimiento reducido verificado.


- 31 pruebas automatizadas del motor: fechas, seriales, validación automática, duplicados, edición, reasociación, recálculo cronológico, revisiones, migración V1, BHA reducido y lectura de celdas partidas.
- Compilación de producción completada.
- Navegador Edge: nueve PDFs cargados y guardados automáticamente, sin marcar registros ni confirmar filas. Total: **9 documentos y 121 eventos**.
- Reingreso de los mismos PDFs después de recargar: se mantienen 9 documentos y 121 eventos.
- Edición de un serial: reasocia el evento, conserva los demás eventos y recalcula las dos herramientas afectadas.
- Un documento incompleto se conserva con sus cambios al recargar. Se mantiene en Documentos para completarlo.
- El visor abre los originales desde el archivo local.
- Vista móvil de 390 × 844 sin desbordamiento horizontal de la página; tablas con desplazamiento interno.
- Recarga sin conexión: documentos, pendientes y datos locales disponibles.
- Conflicto de edición entre dos pestañas: se rechaza la revisión obsoleta sin sobrescribir la modificación más reciente.
- Migración desde estructura V1: conserva documentos, eventos y el PDF guardado en IndexedDB versión 1; permite editar después de migrar a versión 2.
- Recuperación de un PDF archivado con procesamiento interrumpido: al entrar, genera automáticamente sus once eventos y un solo documento.

## Fuentes de referencia

| Documento | Tipo | Eventos |
|---|---|---:|
| 472209260004 | INSPECTION | 2 |
| 472209260005 | INSPECTION | 1 |
| 472209260006 | INSPECTION | 9 |
| 472209260007 | INSPECTION | 4 |
| HW9325288W | REPAIR | 6 |
| HW9328075W | REPAIR | 11 |
| BHA 25 | BHA | 24 |
| BHA 26 | BHA | 24 |
| BHA 30 | BHA | 40 |
| **Total** | | **121** |

Las pruebas de navegador se hicieron en contextos temporales de demostración, separados de los datos del usuario. Los originales operativos no se distribuyen en el proyecto.

## Límite de comprobación

La validación de nueve documentos conocidos no garantiza la extracción de cualquier formato futuro. Los campos críticos ausentes o inconsistentes dejan el reporte pendiente. Los campos BHA opcionales sin una asociación clara pueden permanecer vacíos.

Las pruebas de persistencia y edición de navegador utilizaron el repositorio local. La configuración de este proyecto todavía no contiene credenciales públicas Firebase: autenticación, correos, reglas y transacciones contra Firebase real siguen pendientes de verificación en el proyecto del usuario. Se actualizaron el adaptador y las reglas para soportar edición. La publicación en GitHub Pages también requiere el repositorio del usuario.


## Verificación V5

- Historial horizontal: 77 seriales únicos, 121 eventos únicos, 86 columnas. Verificación por identificador de evento contra los datos de referencia: cada evento pertenece a la fila correcta y las fechas avanzan de izquierda a derecha. Comprobado tanto el archivo de referencia como la descarga desde el navegador.
- Nueva prueba de bloques horizontales con fechas de importación desordenadas, datos completos y espacios vacíos para seriales con menos eventos.
- Estilo Steep verificado en login, dashboard, carga y calendario móvil de 390 px sin desbordamiento horizontal de página. Agenda, edición, persistencia y doble confirmación de borrado comprobados en sesión aislada.


## Verificación V5.1

- Tarjetas: hover, teclado, Escape, cierre manual, abrir reporte y selección móvil. Fechas del eje sin solapamientos con los datos de referencia y pruebas de fechas próximas/únicas. Movimiento reducido sin animación.
- Exportación esencial: una fila por herramienta, seis columnas por evento en orden cronológico. Las hojas por formato conservan toda la información.
