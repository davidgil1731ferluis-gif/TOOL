# Indicadores y selección de herramientas

## Comportamiento

- Cuatro tarjetas: disponibilidad técnica; reparables/fuera de servicio; antigüedad de inspección; herramientas con dos o más reparaciones en el periodo.
- Disponibilidad = herramientas OPERATIVA o CONFORME / inventario total del proyecto. Los estados ausentes o desconocidos se muestran aparte. Un proyecto vacío muestra —, sin inventar un porcentaje.
- Antigüedad = días calendario desde la última inspección con fecha real válida y no futura. Umbral predeterminado 90 días, ajustable. No significa vencimiento normativo. Las herramientas sin inspección se separan; la mediana usa únicamente fechas observadas.
- Recurrencia = dos o más eventos REPAIR únicos por serial en los últimos 12 meses calendario, incluidos ambos extremos. Periodo ajustable a 3, 6, 12 o 24 meses. Se excluyen eventos ajenos al inventario y fechas inválidas o futuras.
- Los detalles muestran las herramientas que respaldan cada cifra y abren su ficha.
- Los indicadores se recalculan tras cambios locales y se leen automáticamente cada minuto con el resumen visible, al recuperar el foco o la conexión. Se reutilizan caché, cola y detección de conflictos existentes. La fecha de consulta avanza automáticamente; no se guardan acumulados derivados en la base.
- Preferencias de periodos aisladas por cuenta/proyecto. Sin conexión se calculan los registros disponibles; se informa la procedencia y los cambios pendientes. No se promete sincronización instantánea.
- OPERATIVA y CONFORME comparten etiqueta y filtro en Herramientas. Se conservan sus códigos originales y las conclusiones de cada evento/reporte para mantener trazabilidad.
- Nombres largos con puntos suspensivos y nombre completo al pasar el cursor, abrir ficha o editar. Las acciones permanecen visibles; en tablet/móvil se usan tarjetas sin desplazamiento horizontal.
- Selección individual o de todos los resultados actuales. Los seriales elegidos se conservan al cambiar filtros; el total incluye los elegidos que no se vean. Limpiar filtros no borra la selección; Limpiar selección sí. Cambiar de proyecto la reinicia.
- Asignar grupo permite elegir uno existente o crearlo con RGB sin abandonar Herramientas. Aplicar mueve únicamente las herramientas seleccionadas, conserva nombres e historiales y utiliza lotes de hasta 100 seriales. Un fallo conserva seleccionados los lotes pendientes; los ya guardados no se repiten.
- La asignación guarda la generación de cada serial para rechazar herramientas eliminadas o recreadas antes de sincronizar. No requiere migrar datos ni cambiar reglas de Firestore.

## Validación

160 pruebas automatizadas aprobadas, incluida cola sin conexión, lectura de indicadores, límites/fechas, denominadores, equivalencia de estados, preservación de registros y rechazo de selecciones obsoletas. Compilación de producción aprobada.

11 escenarios de navegador con datos de prueba aislados: cuatro valores verificables; ajustes de periodos; detalle/ficha; actualización al minuto sin recargar; filtro combinado; nombre de 160 caracteres; selección individual/filtrada; crear/asignar grupo RGB; escritorio/1024/768/390 píxeles; uso sin conexión/movimiento reducido; asignación de 105 herramientas y aislamiento de proyecto/preferencias.

Las pruebas de interfaz se ejecutan en el modo local con almacenamiento aislado. No modifican cuentas ni datos reales de Firebase.
