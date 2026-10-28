# Verificación de edición y grupos

Fecha: 27 de octubre de 2026.

## Cambios

Crear grupos desde Nueva/Editar herramienta sin reemplazar el formulario; preselección del grupo activo; accesos de herramientas desde el gestor; retorno al gestor al guardar/cancelar/Escape; acciones de guardado accesibles durante el desplazamiento.

## Comprobaciones realizadas

- Suite existente: 114 pruebas aprobadas, sin fallos.
- Compilación de producción completada.
- Nueve escenarios de navegador aprobados con Chrome y datos de demostración aislados:
  1. Nombre de grupo vacío o duplicado muestra error y conserva los campos de herramienta.
  2. Crear grupo conserva serial/nombre/tipo y selecciona el grupo nuevo; guardar con una propuesta sin crear exige resolverla primero.
  3. Asignar el grupo conserva documentos, eventos, BHA, miembros, agenda y estado técnico.
  4. Cambiar a un grupo existente desde la ficha conserva esa pantalla de origen.
  5. Guardar un grupo, cancelar y pulsar Escape regresan al gestor.
  6. Nueva herramienta desde un grupo lo preselecciona y regresa al gestor; cancelar la creación interna conserva el serial.
  7. Ver herramientas muestra el grupo seleccionado; Nueva herramienta respeta ese grupo.
  8. Creación y asignación sin red verificadas en modo local, a 390 × 844, sin desbordamiento horizontal.
  9. Grupo y asignación persisten al recargar.
- Ningún error JavaScript durante los escenarios.

## Alcance

La prueba de interfaz sin red utilizó el modo local. Las pruebas existentes cubren persistencia de cola y envío ordenado de grupos/herramientas con OfflineRepository; no se realizaron escrituras de prueba en Firebase real. La compilación mantiene el aviso existente de tamaño de algunos archivos JavaScript, sin impedir la generación.

El grupo se guarda al pulsar Crear y seleccionar grupo; la asignación a la herramienta ocurre al guardar la herramienta. Cancelar la edición conserva los grupos ya creados y descarta los cambios de esa herramienta.

Las pruebas no modificaron datos de producción. La publicación utiliza el flujo existente de GitHub Pages, sin cambios en las reglas de Firebase.

Se revisaron los textos de acceso, resumen, carga, herramientas, documentos, calendario y grupos: etiquetas breves, instrucciones directas y sin frases promocionales.
