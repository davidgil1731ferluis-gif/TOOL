# Revisión de diferencias de cantidad

Verificado el 14 de octubre de 2026:

- 60 pruebas automatizadas aprobadas, incluidas seis de conteos y confirmación.
- Escenario: cantidad leída 12, registros detectados 22. El guardado automático queda bloqueado hasta revisar la lista y confirmar el reporte completo. Después se guardan 22 eventos y 22 herramientas, conservando la lectura original de 12 y la confirmación fechada.
- Confirmar la cantidad no omite la matriz de datos ni permite duplicados. La confirmación deja de ser válida si cambia un serial, el tipo o la cantidad leída; reordenar la lista no la invalida.
- El motor conserva todas las cantidades y su página de origen. Si encuentra cantidades distintas exige revisión incluso si la primera coincide con el número de registros.
- Prueba en navegador con un pendiente de la versión anterior: bloqueo inicial, confirmación única, persistencia al recargar, guardado correcto de 22 eventos, edición posterior que exige nueva confirmación y vista móvil sin desbordamiento. Datos sintéticos en demostración local; no se modificaron datos reales.
- No requiere modificar las reglas de Firebase. La confirmación se conserva en el documento, dentro del proyecto y la cuenta actuales.

No se verificó el PDF concreto que produjo la discrepancia comunicada por el usuario: la corrección permite resolverla de forma explícita sin asumir que el primer número o el número mayor sea el total correcto.
