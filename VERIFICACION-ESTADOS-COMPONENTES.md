# Validación de estados por pieza

- 104 pruebas automatizadas aprobadas. Casos nuevos: tres sugerencias exactas, OK en mayúsculas/minúsculas/espacios, variantes de los estados conocidos, preservación de códigos desconocidos, análisis automático de PDF y tablas, guardado manual normalizado, evidencia intacta, reparación operativa y Excel de eventos históricos sin mutación del origen.
- Chrome aislado en demostración: Cuerpo/PIN/BOX de inspección y PIN/BOX de reparación ofrecen exactamente las tres opciones; escribir OK y salir del campo muestra Conforme. Guardar, recargar sin conexión y reabrir mantiene Conforme. Una importación CSV con ok/OK guarda automáticamente los estados como Conforme y la herramienta como OPERATIVA. Sin errores JavaScript.
- Se usa la misma normalización en extracción, guardado, vistas y exportación. No se deduce la conformidad final de un OK aislado ni se convierten códigos desconocidos en Conforme.
- No se migraron ni sobrescribieron datos productivos, ni se cambiaron reglas Firebase. Las pruebas de navegador se realizaron en perfiles aislados de demostración.
