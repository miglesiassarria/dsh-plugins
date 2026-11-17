# Gestor de skills

Estado: build (especificación aceptada por el usuario)

## Objetivo
Crear un complemento DSH que permita crear y mantener skills reutilizables desde la configuración, con evaluación explicable y generación asistida por IA.

## Comportamiento y criterios verificables
1. La configuración ofrece una entrada identificable para acceder al gestor. Verificar la integración en el cliente instalado o, si no existe acceso visual, mediante la inspección del slot y comunicar la limitación.
2. El gestor permite crear, listar y editar nombre, descripción, instrucciones y archivos auxiliares, incluidos scripts. Una prueba crea una skill, recarga sus datos y comprueba que las modificaciones persisten.
3. Las skills creadas siguen el formato y la ubicación compatibles con el proveedor de DSH; una prueba consulta el catálogo y recupera una skill guardada. No se modifican otras skills silenciosamente.
4. El evaluador muestra una puntuación orientativa de 0 a 100, criterios y recomendaciones; pruebas con entradas incompletas y completas verifican los resultados. La puntuación no certifica seguridad ni ejecución correcta.
5. A partir de una petición, el modelo configurado puede proponer un borrador editable y evaluable antes de guardarlo. Una prueba con modelo simulado comprueba la generación y los errores; un fallo no sobrescribe datos existentes.
6. Los nombres y rutas se validan, se rechazan escapes del directorio y no se ejecutan scripts automáticamente. Las pruebas cubren rutas maliciosas y conflictos.
7. El complemento incluye documentación de instalación, uso, alcance y limitaciones; se ejecutan las pruebas disponibles y se revisa el diff.

## Supuestos
- La generación usa el modelo disponible de DSH cuando la API lo permita; no configura credenciales por su cuenta.
- Los scripts son archivos editables; ejecutarlos no es parte del guardado ni de la evaluación.
- La integración y disponibilidad exactas dependen de los puntos de extensión del runtime instalado.

## Fuera de alcance
- Ejecutar scripts automáticamente o garantizar que código generado sea seguro.
- Modificar skills ajenas, proveedores externos o configuraciones de modelos sin solicitud expresa.
- Afirmar que una puntuación sustituye pruebas reales de una skill.

## Hallazgos de integración
- La inspección del servicio Host `skills` confirma lectura de catálogo y detalle, pero no una API de escritura; la persistencia necesita un adaptador propio y debe respetar el origen y la precedencia de cada skill.
- La interfaz y las herramientas del agente deben compartir las operaciones de Host, con un punto de entrada accesible al cliente cuya autorización se verifique; registrar una ruta HTTP no demuestra por sí solo que sea segura.
- `agentDefaultModel.currentSelection()` proporciona la selección predeterminada; `llm.stream()` devuelve fragmentos y puede terminar en error o cancelación. La disponibilidad y las credenciales se comprueban en tiempo de ejecución. La generación produce un borrador y nunca lo guarda automáticamente.
- La inspección activa confirma `settings.section` como punto de extensión para páginas de ajustes; el registro del complemento instalado y su aspecto aún deben verificarse.

## Riesgos
Contenido generado incorrecto o inseguro, colisiones de nombres y cambios en APIs del runtime; se mitigan mediante vista previa editable, validación, pruebas y mensajes explícitos.
