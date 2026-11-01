# Primeros Pasos con Antigravity Apex

[English](GETTING_STARTED.md) • [Русский](GETTING_STARTED.ru.md) • [Español](GETTING_STARTED.es.md) • [Français](GETTING_STARTED.fr.md) • [Português](GETTING_STARTED.pt.md)

Te damos la bienvenida a **Antigravity Apex**, el panel de control de misiones para **Google Antigravity** y el marco de trabajo de orquestación multiagente **AI Development Director**.

Esta guía te acompañará durante tus primeros 5 minutos con Antigravity Apex: desde el inicio del entorno local hasta la monitorización de subagentes autónomos, la revisión de informes de 9 puntos y la inspección de la telemetría en tiempo real.

---

## 1. ¿Qué es Antigravity Apex?

Google Antigravity permite a los agentes autónomos de IA construir software en espacios de trabajo aislados. Sin embargo, a medida que los agentes se multiplican cubriendo tareas de frontend, backend, seguridad, pruebas y aspectos legales, los desarrolladores necesitan visibilidad y control centralizados.

Antigravity Apex proporciona:
- **Visibilidad en Tiempo Real**: Rastrear sesiones activas de agentes, subagentes en ejecución y consumo de tokens en directo conforme suceden.
- **Control de Concurrencia Dinámico**: Regular con seguridad los subagentes concurrentes (hasta 6 trabajadores en paralelo) para evitar saturación de memoria y límites de cuota de API.
- **Puertas de Calidad Multinivel**: Aplicar verificaciones rigurosas (Puerta 1 pruebas unitarias, Puerta 2 revisión independiente, Puerta 2b cumplimiento legal) antes de que las tareas sean aprobadas.
- **Escalado L4 a Argon en Circuito Cerrado**: Detectar automáticamente fallos reiterados (límite de 2 intentos) y escalar a Gemini Pro o Gemini 4 Argon con paquetes de reproducción mínimos y aislados.

---

## 2. Incorporación Rápida en 5 Minutos

### Paso 1: Iniciar los Servicios
Abre tu terminal y navega hasta el directorio del proyecto:

```bash
cd d:\Projects\antigravity-apex
npm run dev
```

Como alternativa en Windows, haz doble clic en [`start.cmd`](../start.cmd) o ejecuta `setup.cmd` para una instalación en 1 clic.

La terminal mostrará:
```text
[ANTIGRAVITY APEX] Server running on http://127.0.0.1:3001
[ANTIGRAVITY APEX] WebSocket stream at ws://127.0.0.1:3001/ws
[ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
[ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
VITE v8.3.5 ready in 250 ms
➜  Local:   http://localhost:5173/
```

### Paso 2: Abrir el Panel de Control
Abre tu navegador web y visita:
**[http://127.0.0.1:5173](http://127.0.0.1:5173)**

La interfaz cargará el panel con estilo **Refero Vercel** (compatible con temas Paper Light y Obsidian Dark), mostrando el indicador de estado de conexión en **ONLINE**.

---

## 3. Recorrido por las Secciones del Panel

Antigravity Apex organiza la telemetría multiagente en 8 vistas especializadas:

### 1. Overview (Control de Misión)
El panel de mando de alto nivel:
- **Estado del Director**: Versión del modelo (`Gemini 3.8 Flash High`), sesiones activas y bloqueos de archivos en curso.
- **Métricas KPI**: Subagentes activos, tareas completadas, tasa global de éxito y consumo total de tokens.
- **Telemetría Reciente**: Registro de eventos en tiempo real con inicios y cierres de agentes, y resultados de puertas de calidad.
- **1-Click Setup**: Botón de acceso directo para desplegar y sincronizar los 17 agentes con Antigravity.

### 2. Gestión de Agentes (Agent Management)
La cuadrícula del grupo de 17 especialistas:
- Visualizar el estado (`idle`, `running`, `blocked`, `escalated`) de todos los especialistas.
- Inspeccionar las instrucciones del sistema y especificaciones de dominio directamente desde `~/.gemini/config/plugins/ai-director/agents/*.md`.
- Monitorizar tasas de éxito individuales e historial de ejecuciones.
- Ejecutar sincronizaciones con Antigravity en 1 clic.

### 3. Flujo en Vivo (Live Workflow)
Un grafo interactivo que representa el ciclo de vida de las tareas:
- Progresión a través de fases: `Director_Triage` → `Solo` / `Specialist` → `QualityGate_L1` → `Independent_L2` → `LegalGate` → `Architect_L3` → `Argon_L4` → `Approved`.
- Animaciones de pulso que destacan las tareas activas en cada nodo.

### 4. Analítica de Modelos (Model Analytics)
Seguimiento del gasto de tokens y rendimiento:
- Desglose por modelos Gemini: **Gemini 3.8 Flash**, **Gemini Pro (Senior Architect)** y **Gemini 4 Argon**.
- Separación nítida entre tokens verificados **LIVE** de transcripciones reales y métricas estimadas **ESTIMATED**.
- Monitorización de costes y contadores de tokens de entrada, salida y lectura de caché.

### 5. Gestor de Tareas (Task Manager)
Tablero operativo de tareas:
- Filtrar tareas por estado, prioridad y agente asignado.
- Examinar detalles de ejecución, contadores de reintentos y registros de errores.
- Revisar el estricto **Informe de 9 Puntos del Subagente** presentado por los especialistas al terminar la tarea.

### 6. Memoria del Director (Director Memory)
Explorador y editor en línea para la base de conocimientos global de AI Director:
- Editar directamente documentos normativos como `DIRECTOR_PROTOCOL.md`, `AGENT_REGISTRY.md`, `QUALITY_GATES.md` y `FAILURE_LOG.md`.
- Las modificaciones se escriben sin latencia en `~/.gemini/antigravity/knowledge/ai-director/`.

### 7. Centro de Escalado (Escalation Center - Gemini 4 Argon)
Cabina de mando para el escalado de Nivel 4:
- Detección autónoma de fallos recurrentes, puntos muertos de diagnóstico y contradicciones entre agentes.
- Selector de nivel de sensibilidad (`conservative`, `balanced`, `aggressive`).
- Generación de paquetes de prompts sanitizados de 18 puntos con copia al portapapeles en un clic.
- Flujo de resolución y análisis de veredictos en circuito cerrado.

### 8. Flujo Unificado de Eventos (Unified Event Stream)
Inspector de eventos JSON de alto rendimiento:
- Flujo continuo de todos los eventos del sistema (`agent.*`, `task.*`, `legal_gate.*`, `escalation.*`).
- Búsqueda y filtrado por tipo de evento, identificador de agente e ID de tarea.
- Copia de cargas útiles JSON en un clic para depuración.

---

## 4. Próximos Pasos

Ahora que tu centro de control está en marcha:
- Consulta [**AGENTS.es.md**](AGENTS.es.md) para ver la descripción completa de los 17 roles especialistas.
- Revisa [**ORCHESTRATION.md**](ORCHESTRATION.md) para conocer las reglas de despacho de tareas, límites de concurrencia y políticas de puertas de calidad.
- Ejecuta `npm run doctor` para verificar el estado y diagnóstico de tu entorno.
