# Preguntas Frecuentes (FAQ)

[English](FAQ.md) • [Русский](FAQ.ru.md) • [Español](FAQ.es.md) • [Français](FAQ.fr.md) • [Português](FAQ.pt.md)

Este documento responde a las preguntas técnicas, arquitectónicas y operativas más habituales sobre **Antigravity Apex**.

---

## 1. Generalidades y Arquitectura

### ¿Qué es Antigravity Apex?
Antigravity Apex es un panel de control local en tiempo real y supervisor operativo para espacios de trabajo multiagente de **Google Antigravity** y el marco de trabajo **AI Development Director**. Ofrece visibilidad centralizada sobre subagentes autónomos, sesiones activas, consumo de tokens y gobernanza de calidad multinivel.

### ¿Reemplaza Antigravity Apex a la CLI o IDE de Antigravity?
No. Antigravity Apex actúa en conjunto con Antigravity como una capa de supervisión operativa. Mientras Antigravity ejecuta las tareas autónomas y la interacción con herramientas, Antigravity Apex supervisa las transcripciones de ejecución, gestiona la concurrencia, valida las puertas de calidad y controla el escalado a Gemini 4 Argon.

### ¿Puedo ejecutar Antigravity Apex sin tener Antigravity instalado?
Sí. Antigravity Apex está completamente desacoplado. Si Antigravity no está instalado o activo, el panel opera con gestión de tareas offline, edición de documentos de memoria y telemetría simulada.

### ¿Qué plataformas son compatibles?
Antigravity Apex está completamente probado y es compatible con:
- **Windows 10/11** (64-bit)
- **macOS** 12+ (Intel y Apple Silicon)
- **Linux** (Ubuntu 22.04+, Debian 11+, Fedora, Arch)

---

## 2. Concurrencia y Rendimiento

### ¿Cuántos subagentes pueden ejecutarse en paralelo?
El sistema admite hasta **6 subagentes simultáneos** (`MAX_CONCURRENT_SUBAGENTS = 6`). Por defecto, la concurrencia está regulada a **3 agentes activos** para mantener la capacidad de respuesta del equipo y evitar límites de cuota de API. Además, los modelos costosos de nivel Pro están limitados a un máximo de **2 instancias simultáneas**.

### ¿Qué es el motor de ingestión "Zero-Disk-Read"?
Los monitores de logs convencionales releen los archivos de transcripción completos desde la línea 0 en cada cambio. En sesiones prolongadas de Antigravity, los registros crecen decenas de megabytes, provocando picos de CPU y lecturas innecesarias en disco.

El motor `JsonlStreamReader` de Antigravity Apex guarda el desplazamiento exacto en bytes (`last_offset`) en SQLite. Cuando se actualiza una transcripción, lee únicamente los nuevos bloques de 64 KB a partir de dicho punto, protegiendo las secuencias UTF-8 multibyte y eliminando lecturas redundantes en disco.

### ¿Afecta el funcionamiento del panel al rendimiento de las compilaciones locales?
El impacto es insignificante. El backend se ejecuta sobre el bucle de eventos ligero de Node.js con `better-sqlite3` en modo WAL, consumiendo menos del 1% de CPU y unos ~60 MB de RAM en reposo.

---

## 3. Enrutamiento de Modelos y Economía de Tokens

### ¿Qué modelos de IA son compatibles?
El sistema distribuye tareas entre la familia Google Gemini:
- **Gemini 3.8 Flash High**: Orquestación del Director, triaje de tareas y arbitraje de calidad.
- **Gemini Flash (Medium/Low)**: Desarrollo estándar rápido y económico (frontend, backend, QA, revisión, investigación).
- **Gemini Pro**: Refactorización arquitectónica profunda y depuración de condiciones de carrera (Arquitecto Senior de Nivel 3).
- **Gemini 4 Argon**: Razonamiento de máxima capacidad en contorno cerrado para bloqueos arquitectónicos de Nivel 4.

### ¿Cuál es la diferencia entre métricas de tokens LIVE y ESTIMATED?
- **LIVE**: Tokens extraídos directamente de transcripciones reales verificadas de Antigravity (`transcript.jsonl`). Reflejan el consumo exacto de tokens de prompt, completado y lectura de caché.
- **ESTIMATED**: Proyecciones estadísticas calculadas a partir de medias históricas para tareas creadas fuera de sesiones en vivo.

### ¿Por qué se mantiene Gemini 4 Argon en un "Contorno Cerrado"?
Gemini 4 Argon es un modelo de ultra-alta capacidad reservado para puntos muertos arquitectónicos críticos. Para evitar un gasto descontrolado de tokens y posibles regresiones en producción:
1. Nunca se invoca ante errores rutinarios (requiere 2 intentos fallidos previos).
2. Recibe un **Paquete de Prompts de 18 Puntos** aislado que incluye únicamente el fragmento mínimo de reproducción (20–50 líneas) y trazas de error sanitizadas.
3. El operador humano cambia a Argon manualmente.
4. Argon emite un diagnóstico y una estrategia de resolución que luego se reasignan a especialistas Flash para su implementación en código.

---

## 4. Puertas de Calidad y Gobernanza Legal

### ¿Cuáles son los 9 puntos requeridos en el Informe de Subagente?
Todo especialista técnico debe presentar un informe estructurado antes de que la tarea supere la Puerta de Calidad 1:
1. `taskName`
2. `status` (`SUCCESS`, `FAILURE` o `BLOCKED`)
3. `summary`
4. `modifiedFiles`
5. `executedChecks`
6. `checkResults`
7. `issuesAndRisks`
8. `pendingItems`
9. `nextSteps`

Los informes que afirman que "todas las pruebas pasaron" sin adjuntar resultados reales del ejecutor de pruebas son rechazados automáticamente.

### ¿Qué es la Puerta de Calidad 2b (Puerta Legal)?
La Puerta 2b evalúa funcionalidades antes de su implementación para asegurar el cumplimiento normativo en la **Federación Rusa** (`RU`) y la **Unión Europea** (`EU_NL`):
- Leyes rusas: 152-FZ (datos personales), 156-FZ (consentimiento aislado), 23-FZ (localización de bases de datos), 149-FZ (difusión de información), 243-FZ (regulación de IA), Parte IV Código Civil (derechos de autor), 38-FZ/479-FZ (publicidad), Ley 2300-1 / 69-FZ (prohibición de patrones oscuros), 54-FZ (cajas registradoras online).
- Regulaciones europeas: GDPR (Reglamento 2016/679), Ley de IA de la UE (Reglamento 2024/1689), Directiva ePrivacy.

### ¿Sustituye la Puerta Legal al asesoramiento jurídico humano?
No. La Puerta de Calidad 2b es un analizador técnico automatizado diseñado para detectar infracciones normativas de forma temprana en el ciclo de desarrollo. Para operaciones de alto riesgo (`RED` o transferencias transfronterizas complejas), recomienda expresamente consultar a un abogado colegiado.

### ¿Qué es el "Invariante No Bloqueante" ante un resultado RED?
Cuando la Puerta Legal detecta una infracción con estado `BLOCKED_RED`, detiene **únicamente la subtarea específica no conforme** (por ejemplo, el envío directo de datos personales no localizados). El trabajo seguro paralelo (diseño de interfaces, maquetación accesible, pruebas unitarias) continúa sin interrupciones.

---

## 5. Personalización y Extensión

### ¿Puedo añadir nuevos roles de agentes al grupo de 17 especialistas?
Sí. Para registrar un nuevo especialista:
1. Crea un archivo de especificación markdown: `~/.gemini/config/plugins/ai-director/agents/<role-id>.md`.
2. Añade el ID del agente a `allowedAgents` en el **Control Center** del panel o vía `POST /api/control/settings`.
3. El agente aparecerá de inmediato en la cuadrícula de **Agent Management** y estará disponible para asignarle tareas.

### ¿Cómo despliego Antigravity Apex en un servidor remoto?
Configura `HOST=0.0.0.0` en `.env` y define los dominios autorizados en `ALLOWED_ORIGINS`. Pasa el token `COMMAND_CENTER_API_KEY` en los encabezados HTTP (`Authorization: Bearer <token>`).
