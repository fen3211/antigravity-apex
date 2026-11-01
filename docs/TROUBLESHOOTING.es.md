# Guía de Resolución de Problemas y Diagnóstico

[English](TROUBLESHOOTING.md) • [Русский](TROUBLESHOOTING.ru.md) • [Español](TROUBLESHOOTING.es.md) • [Français](TROUBLESHOOTING.fr.md) • [Português](TROUBLESHOOTING.pt.md)

Esta guía ofrece procedimientos diagnósticos y soluciones prácticas para los problemas habituales al utilizar **Antigravity Apex**.

---

## 1. Desconexión de WebSocket y Estado "DISCONNECTED"

### Síntomas
- La pílula de estado en la cabecera muestra **DISCONNECTED** o **RECONNECTING**.
- El Flujo Unificado de Eventos deja de actualizarse en tiempo real.

### Pasos de Diagnóstico
1. Abre las Herramientas de Desarrollador del navegador (F12) y revisa la **Consola** y la pestaña **Red** (filtro WS).
2. Identifica el código de cierre del WebSocket:
   - `1008 (Policy Violation)`: Fallo de autenticación (clave de API inválida) u origen CORS no autorizado.
   - `1009 (Message too large)`: Un mensaje individual superó el límite de 64 KB.
   - `1006 (Abnormal Closure)`: El proceso del servidor finalizó o la conexión de red cayó.

### Solución
- **Discrepancia de Token**: Obtén un token actualizado accediendo directamente desde el navegador a `http://127.0.0.1:3001/api/auth/token`. El cliente lo guardará y reutilizará automáticamente.
- **Discrepancia de Origen**: Si accedes al panel desde una IP u host personalizado (p. ej. `http://192.168.1.50:5173`), añade ese origen a `CONFIG.ALLOWED_ORIGINS` en `server/src/config.ts`.
- **Reiniciar el Servidor**: Si el backend se cerró inesperadamente, revisa los registros de la terminal y vuelve a iniciarlo con `npm run dev` o `start.cmd`.

---

## 2. Sesiones o Transcripciones de Antigravity No Detectadas

### Síntomas
- La pestaña **Overview** muestra `0 Active Locks` y `0 Live Transcripts`, a pesar de que Antigravity está en ejecución en otra terminal.

### Pasos de Diagnóstico
1. Comprueba las rutas base de Antigravity en los registros de inicio del servidor:
   ```text
   [ANTIGRAVITY APEX] Antigravity dir: C:\Users\<user>\.gemini\antigravity
   [ANTIGRAVITY APEX] Knowledge dir:   C:\Users\<user>\.gemini\antigravity\knowledge\ai-director
   ```
2. Verifica que las rutas existan en tu disco:
   - Bloqueos de presencia: `~/.gemini/antigravity/presence/`
   - Transcripciones: `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript.jsonl`

### Solución
- **Sobrescritura de Rutas**: Si tu instalación de Antigravity reside en una ubicación no estándar, define explícitamente las rutas en `.env`:
   ```env
   ANTIGRAVITY_DIR=D:\RutaPersonalizada\.gemini\antigravity
   BRAIN_DIR=D:\RutaPersonalizada\.gemini\antigravity\brain
   PRESENCE_DIR=D:\RutaPersonalizada\.gemini\antigravity\presence
   KNOWLEDGE_DIR=D:\RutaPersonalizada\.gemini\antigravity\knowledge\ai-director
   ```
- **Permisos de Archivo**: Asegúrate de que la cuenta de usuario que ejecuta Node.js disponga de permisos de lectura sobre la carpeta `.gemini`.

---

## 3. Bloqueo o Agotamiento del Tiempo de Espera (Timeout) del Subagente

### Síntomas
- Una tarea se mantiene indefinidamente en estado `in_progress`.
- La terminal indica que el subagente iniciado por el supervisor ha dejado de emitir registros.

### Pasos de Diagnóstico
1. Ve a la pestaña **Task Manager** en el panel.
2. Selecciona la tarea bloqueada y revisa sus detalles de ejecución y el PID del proceso.

### Solución
- **Cancelar desde el Panel**: Haz clic en el botón **Cancel Task** en el panel de detalle de la tarea. El supervisor enviará la señal de terminación.
- **Terminación del Árbol de Procesos**: Si el proceso no finaliza correctamente, el supervisor ejecutará la terminación del árbol de procesos. En Windows, puedes forzar el cierre manualmente desde PowerShell:
   ```powershell
   taskkill /PID <PID> /T /F
   ```
- **Ajustar Tiempo de Espera**: Para tareas extensas de compilación o pruebas E2E, incrementa el valor de timeout al invocar `/tasks/:id/execute`:
   ```json
   {
     "timeoutMs": 300000
   }
   ```

---

## 4. Bloqueos en la Base de Datos SQLite (`SQLITE_BUSY: database is locked`)

### Síntomas
- Las peticiones a la API REST devuelven HTTP 500 con `SQLITE_BUSY: database is locked`.

### Pasos de Diagnóstico
1. Revisa si un visualizador externo de SQLite (como DB Browser for SQLite) mantiene abierto `command_center.sqlite` en modo exclusivo.
2. Confirma la existencia de los archivos WAL: `command_center.sqlite-wal` y `command_center.sqlite-shm`.

### Solución
- **Cerrar Visualizadores Externos**: Cierra cualquier herramienta gráfica externa que mantenga bloqueos de lectura/escritura exclusivos.
- **Pragma WAL**: Antigravity Apex utiliza el modo WAL y fija `busy_timeout = 5000` por defecto. Si has editado `database.ts`, asegúrate de que el timeout sea de al menos 5000 ms.
- **Reinicializar BD**: Si el archivo de base de datos se corrompió irreversiblemente, elimina `command_center.sqlite`, `command_center.sqlite-wal` y `command_center.sqlite-shm`. El servidor recreará tablas nuevas y limpias en el siguiente inicio.

---

## 5. La Puerta Legal Devuelve `BLOCKED_RED`

### Síntomas
- Una tarea no supera la Puerta de Calidad 2b con estado `BLOCKED_RED`.

### Pasos de Diagnóstico
1. Revisa el objeto `LegalAssessment` generado y adjunto a la tarea o consulta `GET /api/events?type=legal_gate.blocked`.
2. Lee atentamente los campos `identifiedRisks` y `mechanismOfNonCompliance`.

### Causas Habituales y Correcciones
- **Licencia Copyleft Fuerte**: Se introdujo una biblioteca con licencia AGPL-3.0 o GPL-3.0 en una base de código privativa o distribuida en la nube. Sustitúyela por una alternativa con licencia MIT, Apache-2.0 o BSD.
- **Localización de Datos Personales RF (23-FZ)**: Una base de datos o servicio cloud que almacena datos personales de ciudadanos rusos se encuentra fuera de la Federación Rusa sin un registro primario local. Implementa el registro primario en servidores en Rusia antes de la replicación.
- **Casillas Preseleccionadas (69-FZ)**: Un formulario de consentimiento o compra tiene casillas premarcadas. Elimina la preselección para cumplir con la prohibición de patrones oscuros vigente desde el 01.09.2025.
- **Recuerda el Invariante No Bloqueante**: Cuando ocurre `BLOCKED_RED`, solo se suspende la funcionalidad específica no conforme. No es necesario pausar el desarrollo de estilos de UI o pruebas unitarias independientes.

---

## 6. Rechazo de Ejecución por CLI (`Agent not allowed` / `Command failed`)

### Síntomas
- El inicio de una tarea mediante el Control Center falla con `error: Agent "<name>" is not allowed` o `Invalid CLI arguments`.

### Pasos de Diagnóstico
1. Comprueba la configuración de lista blanca: `GET /api/control/settings`.
2. Examina el prompt en busca de metacaracteres de shell prohibidos: `&`, `|`, `;`, `$`, `>`, `<`, `` ` ``.

### Solución
- Asegúrate de que el identificador del agente figure en `settings.allowedAgents`. Puedes agregar nuevos agentes a través de la pestaña de configuración del **Control Center**.
- Elimina operadores encadenados de shell de la carga útil del prompt. Envía únicamente texto instructivo simple a `agy.exe`.
