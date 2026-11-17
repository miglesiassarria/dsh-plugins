# Estudio de skills

Complemento local para crear y editar skills con instrucciones y archivos auxiliares desde Configuración, evaluarlas mediante criterios orientativos y generar borradores con el modelo predeterminado de DSH.

## Instalación

Instala el directorio local del complemento desde Plugins > Añadir complemento. Tras la activación, abre Configuración > Estudio de skills. La disponibilidad depende de los servicios del perfil DSH y de un modelo configurado.

## Uso y seguridad

Crea un borrador o solicita una propuesta a la IA, revisa nombre, descripción, instrucciones y archivos, y guarda expresamente. La puntuación es heurística y no garantiza corrección ni seguridad. Los scripts se guardan como texto: este complemento no los ejecuta. Revisa todo contenido generado antes de utilizarlo.

Las skills gestionadas se guardan en el directorio `skill-studio` bajo `DSH_HOME` (o `~/.dsh` si no está definido); el proveedor del complemento las incorpora al catálogo DSH mientras está activo. La lista solo muestra skills de Studio y la detección de colisiones no cubre necesariamente otros proyectos o ámbitos. Evita cambios externos simultáneos: el protocolo no protege frente a un proceso local malicioso ni garantiza durabilidad ante pérdida de energía.

Si un proceso termina durante el guardado puede quedar `.studio-write-lock` en ese directorio. Comprueba primero que ningún proceso de Studio esté activo antes de retirarlo manualmente; la siguiente lectura o guardado recuperará una copia única si falta la skill original. Si existen varias copias, consérvalas y revísalas manualmente; no se reemplaza automáticamente una skill existente.

## Pruebas

Desde la raíz del repositorio: `node --test local_skill-studio/test/host.test.mjs`. Las pruebas simuladas no sustituyen una comprobación del complemento instalado ni una prueba visual en el navegador.
