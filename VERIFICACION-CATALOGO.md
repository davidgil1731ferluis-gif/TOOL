# Verificación del catálogo y extracción

- 82 pruebas automatizadas aprobadas, incluyendo regresiones de extracción, estado técnico, historial, Excel, proyectos y sincronización.
- Nuevas pruebas: asignación manual persiste al importar/eliminar reportes; Excel respeta grupos; eliminación parcial conserva otros seriales y miembros BHA; revisión y generación obsoletas bloquean borrado; recibo de eliminación evita duplicar una acción tras perder la respuesta; creación seguida de eliminación sin conexión concilia la generación remota.
- PDF privado aportado: 7 páginas, 11 seriales, fecha de inspección y campos obligatorios completos. Se contrastaron las tablas con las páginas renderizadas. El original y sus datos no se incluyen en el repositorio.
- Navegador Chrome aislado en modo demostración: creación de grupo/color/herramienta, filtro y persistencia tras recarga, cancelación y confirmación de eliminación, carga automática del PDF real con 11 seriales y resultados de cuerpo/PIN/BOX, tarjeta con fecha de inspección, tres colores efectivos del gráfico y móvil de 390 px sin desborde de página ni errores JavaScript.
- Compilación de producción completada. Reglas Firebase compiladas y publicadas en tooltracker-d3140 con la cuenta propietaria.
- La sincronización y sus conflictos se probaron con un remoto simulado y almacenamiento local; no se escribieron datos de prueba en la cuenta productiva. La compilación de reglas no sustituye una prueba integral de transacciones autenticadas en Firebase real.
- Un formato futuro desconocido puede requerir revisión o una plantilla adicional. La extracción no supone conformidad por el nombre del archivo ni por la portada.
