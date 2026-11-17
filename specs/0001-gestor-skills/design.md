# Diseño: gestor de skills

Se implementará un bundle local con cliente de ajustes y operaciones Host compartidas; la persistencia usará un directorio compatible con el descubrimiento de skills, con validación de rutas, conflictos y protección de archivos ajenos. La evaluación será heurística y explícitamente orientativa; la generación usará la selección de modelo DSH y solo devolverá borradores.

## Componentes y decisiones
- `local_skill-studio/client.js`: sección de ajustes y editor. Alternativa: una página externa; descartada por no integrarse en DSH.
- Módulos Host y pruebas en `local_skill-studio/`: almacenamiento, evaluación y adaptador LLM. Alternativa: registrar solo en memoria; descartada porque no persiste.
- Transporte: elegir una interfaz autenticada del runtime tras inspeccionar el contrato, no asumir protección de rutas arbitrarias. UI y herramienta deben reutilizar operaciones.
- Conservar fuentes existentes sin cambios por defecto; proteger contra traversal, enlaces simbólicos y revisiones obsoletas.
- No ejecutar scripts al guardar ni evaluar. Los resultados IA requieren revisión humana.

## Verificación y riesgos
Pruebas aisladas con directorios temporales y LLM simulado cubren persistencia, conflictos, traversal, puntuaciones y generación fallida. La instalación real y el catálogo verifican compatibilidad; el slot en vivo y la inspección visual requieren cliente conectado. Antes de publicar se revisará el diff completo, seguridad del transporte y disposición de recursos. La falta de autorización o cliente accesible debe comunicarse, no simularse.
