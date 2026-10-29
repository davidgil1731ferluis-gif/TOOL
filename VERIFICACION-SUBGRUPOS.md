# Grupos y subgrupos

La clasificación tiene dos niveles: Grupo → Subgrupo. El grupo es obligatorio y el subgrupo opcional. Las herramientas ya guardadas mantienen su grupo y se consultan como «Sin subgrupo» hasta que se les asigne uno. No se ejecuta ninguna migración ni se completan clasificaciones por suposición.

## Flujos

- Nueva/Editar herramienta, desde la tabla o la ficha: selectores dependientes, creación de grupo y subgrupo con RGB en el mismo formulario, conservando los campos sin guardar.
- Selección múltiple: muestra la clasificación común cuando las herramientas la comparten. Permite crear grupo/subgrupo y asignarlos por lotes de hasta 100. Al terminar muestra la clasificación de destino.
- Añadir seriales: los mismos controles de grupo/subgrupo y creación integrada; los seriales existentes conservan nombre, tipo, estado e historial.
- Traslados al eliminar una clasificación: el mismo selector y creación de grupo/subgrupo de destino, sin salir del formulario; solo se elimina la clasificación de origen y se conservan todos sus seriales e historiales.
- Crear grupo independiente: Ubicación permite crear un grupo principal o un subgrupo de un padre existente. No admite un tercer nivel.
- Gestor: grupos con subgrupos anidados, colores, cantidades y accesos a ver, añadir, crear herramienta, editar o eliminar. Los nombres son únicos dentro del mismo padre y pueden repetirse bajo padres distintos.
- Herramientas y ficha: el grupo y el subgrupo aparecen como etiquetas de distinta jerarquía. Los filtros muestran Todos, Sin subgrupo y los subgrupos del padre seleccionado; se combinan con nombre/serial, estado, fechas y cantidad de eventos.
- Cambiar de grupo limpia una selección de subgrupo incompatible. Crear una clasificación la guarda inmediatamente; asignar la herramienta se confirma al guardar el formulario. Un nombre de clasificación pendiente impide guardar hasta crearlo o cancelarlo.

## Excel

«Grupo» y «Subgrupo» son columnas contiguas en Historial por herramienta, Inspecciones, Reparaciones, BHA y Por completar. Se utiliza «Sin subgrupo» cuando no hay asignación. Excel de esta vista respeta ambos filtros y conserva todos los eventos de los seriales elegidos. Las fechas, identificadores, seriales con ceros iniciales, evidencia y detalles mantienen sus valores. La nueva columna desplaza una posición las columnas posteriores; se actualizó el cálculo del límite de 16.384 columnas.

## Conservación y sincronización

Los subgrupos se guardan en la colección toolGroups existente con parentId; las herramientas pueden tener subgroupId. Los documentos, eventos, BHA y agenda no cambian al clasificar. Renombrar conserva los identificadores y actualiza los nombres resueltos en la interfaz y el Excel.

Eliminar un subgrupo requiere confirmar y elegir Sin subgrupo u otro grupo/subgrupo para conservar sus herramientas e historiales. Eliminar un padre que todavía contiene subgrupos se bloquea hasta resolverlos. Borrar todos los seriales de un grupo mantiene las confirmaciones anteriores y conserva la estructura de grupos/subgrupos vacía.

La cola sin conexión conserva las clasificaciones y el orden de creación de padre, subgrupo y asignación. Las generaciones de herramientas, subgrupos y padres se comprueban al sincronizar; una referencia eliminada, recreada o incompatible se rechaza para revisión. Los recibos conservan la protección frente a reintentos. Las transacciones leen las fichas actuales y comprueban cambios de pertenencia antes de trasladar herramientas.

Las reglas de Firestore se ampliaron para admitir parentId e identificadores de subgrupo; validan el padre y la relación del subgrupo con el grupo de la herramienta. Se mantienen la propiedad por cuenta, correo verificado, separación de proyectos y todas las validaciones de documentos/eventos. Reglas compiladas, validadas y publicadas en tooltracker-d3140 antes de publicar el frontend.

## Validación

- 182 pruebas automatizadas aprobadas: 160 anteriores y 22 nuevas de jerarquía, nombres, asignación, conservación, importación/edición de reportes, Excel real, filtros, cola sin conexión, generaciones y transacciones cloud.
- Las pruebas cloud ejecutan los métodos de transacción de producción con un doble aislado del SDK que impide lecturas después de escrituras y evita confirmar cambios ante errores. No utilizan cuentas ni datos reales.
- Once escenarios de navegador verifican edición, preselección de nuevas herramientas, selección múltiple, creación RGB, gestor, renombrado, eliminación protegida, Excel descargado, guardados sin conexión, reinicio y aislamiento de proyectos. Revisión a 1440, 768 y 390 píxeles sin desbordamiento horizontal ni errores JavaScript.
- Compilación de producción aprobada. Los datos originales de prueba —nombres, estados, documentos, eventos, BHA y agenda— se comparan completos después de los flujos. No se modificaron registros reales durante las pruebas.
