# Diseño

El Host conservará un directorio por skill y ampliará el contrato de archivos para transportar bytes sin pérdidas, manteniendo compatibilidad con los textos existentes. El selector múltiple del navegador copia archivos al borrador; el guardado los persiste bajo rutas relativas validadas. Los binarios no se editarán como texto.

La eliminación utilizará el mismo bloqueo y control de revisión que los guardados, operará solo sobre skills gestionadas y actualizará el catálogo; la interfaz solicitará confirmación explícita. El listado será una columna de nombres compactos con filtro y desplazamiento.

Alternativas descartadas: leer binarios como UTF-8 (corrompe datos); eliminar por nombre sin revisión (riesgo de borrar cambios ajenos); importar rutas arbitrarias del Host (sin acceso seguro desde navegador).

Pruebas: recuperación binaria exacta, regresión de texto, rutas y límites, eliminación y conflictos, sintaxis cliente, inspección de interfaz y revisión de recursos. Verificar la versión efectivamente cargada y declarar cualquier necesidad de reinicio.
