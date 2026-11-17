# Mejoras de gestión de skills

Estado: build, aceptada por el usuario.

## Objetivo
Permitir borrar skills de Studio, añadir archivos seleccionados en el explorador y gestionar bibliotecas numerosas con un listado compacto.

## Criterios verificables
1. La interfaz permite eliminar una skill guardada de Studio tras una confirmación que nombre la skill y advierta de la eliminación de sus archivos. Una prueba verifica que desaparece del catálogo y que una revisión obsoleta no la borra; no se afectan otras skills.
2. El botón Añadir abre el selector nativo de archivos y permite elegir varios. Al guardar se copian al directorio propio de la skill, sin ejecutar scripts; se conservan sus bytes, incluidos archivos binarios. Pruebas guardan y recuperan archivos de texto y binarios, detectan duplicados, rutas inválidas y excesos de tamaño, y comprueban que no se modifican los archivos originales.
3. Cada skill conserva `SKILL.md` y sus archivos auxiliares en su directorio. Las skills ya guardadas siguen legibles y editables. Pruebas de regresión verifican compatibilidad.
4. La biblioteca muestra filas compactas con solo el nombre de cada skill y permite filtrar por nombre; con muchos elementos el listado tiene desplazamiento independiente. Pruebas o inspección verifican filtro y presentación sin descripciones en las filas.
5. La eliminación, importación y búsqueda muestran errores recuperables; las pruebas comprueban cancelación, colisiones y límites. Las acciones disponibles para el agente comparten operaciones con la interfaz.

## Supuestos y seguridad
- Solo se borran skills administradas por Studio, con comprobación de revisión; pedir confirmación antes de la acción destructiva.
- Los ficheros seleccionados se añaden inicialmente usando su nombre; la interfaz permite indicar una ruta relativa para organizarlos, sin permitir escapes ni sobrescribir silenciosamente archivos de igual ruta.
- Archivos binarios se conservan pero no se muestran como texto editable. Se mantienen límites razonables de tamaño y cantidad, comunicados en la interfaz.
- La interfaz respeta el tema existente. La comprobación visual depende del acceso a la página real.

## Fuera de alcance
- Borrar skills de otros proveedores o proyectos.
- Ejecutar automáticamente los archivos o garantizar la seguridad de su contenido.
- Importar recursivamente carpetas completas; se seleccionan archivos.
