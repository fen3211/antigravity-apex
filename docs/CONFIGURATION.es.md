[English](CONFIGURATION.md) • [Русский](CONFIGURATION.ru.md) • [Español](CONFIGURATION.es.md) • [Français](CONFIGURATION.fr.md) • [Português](CONFIGURATION.pt.md)

# Referencia de Configuración

Este documento proporciona una referencia completa de todas las opciones de configuración estáticas y en tiempo de ejecución de **Antigravity Apex**.

---

## 1. Variables de Entorno (`.env`)

Antigravity Apex carga la configuración desde `.env` mediante `dotenv`. Todos los parámetros cuentan con valores predeterminados seguros y listos para producción.

### Red y Entorno de Ejecución del Servidor

| Variable | Tipo | Predeterminado | Descripción |
|----------|------|----------------|-------------|
| `PORT` | `number` | `3001` | Puerto HTTP y WebSocket en el que se enlaza el servidor backend Express. |
| `HOST` | `string` | `127.0.0.1` | Dirección de interfaz de red para el enlace. Por defecto en loopback por seguridad local. |
| `NODE_ENV` | `string` | `development` | Ajustar a `production` en compilaciones de producción para habilitar caché estricto y reducir logs. |

### Seguridad y Autenticación

| Variable | Tipo | Predeterminado | Descripción |
|----------|------|----------------|-------------|
| `COMMAND_CENTER_API_KEY` | `string` | *(Generado automáticamente)* | Token hexadecimal criptográfico de 32 bytes (64 caracteres hex) requerido para todos los endpoints mutables y aperturas de WebSocket. Si se deja vacío, el servidor genera uno en el primer inicio y lo almacena en `.env`. |

### Rutas del Sistema de Archivos de Antigravity

Por defecto, las rutas se resuelven de forma relativa al directorio personal del usuario (`~/.gemini/antigravity`). Puedes sobrescribirlas individualmente:

| Variable | Predeterminado (Windows) | Predeterminado (Linux/macOS) | Descripción |
|----------|--------------------------|------------------------------|-------------|
| `ANTIGRAVITY_DIR` | `%USERPROFILE%\.gemini\antigravity` | `~/.gemini/antigravity` | Directorio base de la instalación de Google Antigravity. |
| `KNOWLEDGE_DIR` | `%USERPROFILE%\.gemini\antigravity\knowledge\ai-director` | `~/.gemini/antigravity/knowledge/ai-director` | Directorio con los documentos de protocolo en markdown de AI Development Director. |
| `PRESENCE_DIR` | `%USERPROFILE%\.gemini\antigravity\presence` | `~/.gemini/antigravity/presence` | Directorio supervisado para archivos `.lock` de sesiones activas. |
| `BRAIN_DIR` | `%USERPROFILE%\.gemini\antigravity\brain` | `~/.gemini/antigravity/brain` | Directorio que contiene las transcripciones de ejecución de los subagentes (`transcript.jsonl`). |
| `AGY_CLI_PATH` | `%LOCALAPPDATA%\agy\bin\agy.exe` | `/usr/local/bin/agy` | Ruta al ejecutable CLI de Antigravity. |
| `DB_PATH` | `./command_center.sqlite` | `./command_center.sqlite` | Ruta del sistema de archivos a la base de datos local SQLite. |

---

## 2. Ajustes de Control Dinámico (API en Tiempo de Ejecución)

Además de `.env`, Antigravity Apex almacena configuraciones operativas dinámicas en la tabla `settings` de SQLite. Estas se pueden ajustar mediante la interfaz de usuario (**Control Center**) o vía API REST:

- **Endpoints**: `GET /api/control/settings` y `POST /api/control/settings`
- **Autenticación**: Requiere el encabezado `COMMAND_CENTER_API_KEY` o parámetro de consulta con el token.

### Esquema y Atributos

```json
{
  "maxConcurrentAgents": 3,
  "maxRetryAttempts": 2,
  "defaultModelTier": "gemini-3.8-flash-high",
  "escalationPolicy": "strict",
  "autoQualityGates": true,
  "allowedAgents": [
    "director",
    "researcher",
    "frontend-developer",
    "backend-developer",
    "ui-ux-designer",
    "qa-engineer",
    "code-reviewer",
    "senior-architect",
    "legal-compliance",
    "security-engineer",
    "devops-engineer",
    "product-manager",
    "ai-evaluation-engineer",
    "performance-engineer",
    "accessibility-specialist",
    "database-specialist",
    "data-engineer"
  ]
}
```

### Explicación de Parámetros

1. `maxConcurrentAgents` (entero, 1–10):
   Controla el número máximo de procesos de subagentes que el supervisor puede iniciar simultáneamente. Recomendado: `3` para desarrollo multiagente típico; máximo probado: `6`.
2. `maxRetryAttempts` (entero, 1–10):
   Número máximo de reintentos por enfoque antes de activar el escalado automático de Nivel 3 a Senior Architect. Por defecto: `2`.
3. `defaultModelTier` (cadena de texto):
   El nivel de modelo Gemini predeterminado asignado a nuevas tareas. Normalmente `gemini-3.8-flash-high`.
4. `escalationPolicy` (`"strict"` | `"relaxed"`):
   - `"strict"`: Bloquea inmediatamente las tareas tras 2 fallos consecutivos e invoca el sintetizador de prompts para Argon.
   - `"relaxed"`: Permite un intento adicional antes de escalar.
5. `autoQualityGates` (booleano):
   Cuando es verdadero, el sistema ejecuta automáticamente las comprobaciones de la Puerta de Calidad 1 al recibir el informe del subagente.
6. `allowedAgents` (matriz de cadenas):
   Lista blanca estricta de identificadores de agentes con permiso de ejecución mediante el puente del supervisor. Previene ejecuciones no autorizadas.

---

## 3. CORS y Lista Blanca de Red

El backend impone una verificación rigurosa de orígenes CORS a través de `CONFIG.ALLOWED_ORIGINS`:

```typescript
ALLOWED_ORIGINS: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]
```

Las peticiones de orígenes no autorizados son rechazadas con **HTTP 403 Forbidden**. Si ejecutas el frontend en un puerto o nombre de host personalizado, añádelo a `CONFIG.ALLOWED_ORIGINS` en `server/src/config.ts`.

---

## 4. Parámetros Operativos de WebSocket

El servidor WebSocket (`ws://127.0.0.1:3001/ws`) opera bajo estrictos márgenes de resiliencia:

- **Tamaño Máximo de Carga Útil**: `64 KB` (`MAX_WS_PAYLOAD = 64 * 1024`). Cualquier mensaje entrante que supere este límite es rechazado con el código de cierre `1009 (Message too large)` y desconexión inmediata.
- **Intervalo de Latido (Heartbeat)**: 30 segundos. Los clientes deben responder a los mensajes `ping` con una trama `pong`; las conexiones inactivas se purgan de forma automática.
- **Autenticación**: Requiere un token válido proporcionado mediante:
  - Parámetro de consulta: `?token=<API_KEY>`
  - Encabezado: `Authorization: Bearer <API_KEY>`
  - Encabezado: `x-api-key: <API_KEY>`

---

## 5. Configuración de Filtros del Monitor de Archivos

El monitor de sistema de archivos Chokidar filtra eventos mediante `createAntigravityPathFilter(brainDir, presenceDir)`:

### Archivos Permitidos:
- Cualquier archivo con extensión `.lock` dentro de `PRESENCE_DIR`.
- Cualquier archivo con nombre `transcript.jsonl` ubicado en un subdirectorio `.system_generated/logs/` dentro de `BRAIN_DIR`.

### Objetivos Excluidos / Ignorados:
- Archivos temporales: `.tmp`, `.swp`, `~*`, `.bak`, `~$*`, `.crdownload`.
- Archivos de punto y directorios ocultos (excepto `.system_generated`).
- Directorios pesados de construcción y caché: `node_modules`, `.git`, `dist`, `scratch`, `tempmediaStorage`, `.user_uploaded`.
