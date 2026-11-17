# Estudio de skills

Complemento local para crear y editar skills con instrucciones y archivos auxiliares desde Configuración, evaluarlas mediante criterios orientativos y generar borradores con el modelo predeterminado de DSH.

## Instalación

Instala el directorio local del complemento desde Plugins > Añadir complemento. Tras la activación, abre Configuración > Estudio de skills. La disponibilidad depende de los servicios del perfil DSH y de un modelo configurado.

## Uso y seguridad

Crea un borrador o solicita una propuesta a la IA, revisa nombre, descripción, instrucciones y archivos, y guarda expresamente. Selecciona uno o varios archivos desde el explorador y cambia sus rutas relativas para organizarlos dentro del directorio de la skill. Los binarios se conservan sin editarlos como texto; máximo 100 archivos, 1 MiB por archivo y 4 MiB en conjunto. Los archivos se guardan sin permiso de ejecución (`0600`); si necesitas ejecutar un script deberás revisar su contenido y ajustar sus permisos deliberadamente. La lista se filtra por nombre. Puedes eliminar una skill de Studio y todos sus archivos previa confirmación. La puntuación es heurística y no garantiza corrección ni seguridad. El complemento no ejecuta scripts. Revisa todo contenido generado antes de utilizarlo.

Las skills gestionadas se guardan en el directorio `skill-studio` bajo `DSH_HOME` (o `~/.dsh` si no está definido); el proveedor del complemento las incorpora al catálogo DSH mientras está activo. La lista solo muestra skills de Studio y la detección de colisiones no cubre necesariamente otros proyectos o ámbitos. Evita cambios externos simultáneos: el protocolo no protege frente a un proceso local malicioso ni garantiza durabilidad ante pérdida de energía.

Si un proceso termina durante el guardado puede quedar `.studio-write-lock` en ese directorio. Comprueba primero que ningún proceso de Studio esté activo antes de retirarlo manualmente; la siguiente lectura o guardado recuperará una copia única si falta la skill original. Si existen varias copias, consérvalas y revísalas manualmente; no se reemplaza automáticamente una skill existente.

## Pruebas

Desde la raíz del repositorio: `node --test local_skill-studio/test/*.test.mjs`. Las pruebas simuladas no sustituyen una comprobación del complemento instalado ni una prueba visual en el navegador.
