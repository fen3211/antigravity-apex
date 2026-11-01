# Guía de Instalación y Configuración

[English](INSTALLATION.md) • [Русский](INSTALLATION.ru.md) • [Español](INSTALLATION.es.md) • [Français](INSTALLATION.fr.md) • [Português](INSTALLATION.pt.md)

Esta guía proporciona instrucciones detalladas paso a paso para instalar y configurar **Antigravity Apex** en entornos **Windows**, **macOS** y **Linux**, incluyendo lanzadores en 1 clic, comandos remotos en una línea e instalaciones manuales.

---

## ⚡ Instalación Rápida en 1 Clic

### Instalación en 1 Clic en Windows
1. Descarga o clona este repositorio.
2. Haz doble clic en [`setup.cmd`](../setup.cmd) (o [`setup.bat`](../setup.bat)) en la raíz del proyecto.
3. El script instala automáticamente todas las dependencias, despliega la configuración de los 17 agentes en `~/.gemini/config/plugins/ai-director`, ejecuta `doctor.js`, inicia el servidor y abre tu navegador en `http://127.0.0.1:5173/`.

### Instalación en 1 Clic en Linux / macOS
```bash
chmod +x setup.sh && ./setup.sh
```

### Comando Remoto en Una Línea (Sin clonar previamente)
- **Windows (PowerShell)**:
  ```powershell
  irm https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.ps1 | iex
  ```
- **Linux y macOS (Bash)**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/fen3211/antigravity-apex/main/scripts/get.sh | bash
  ```

---

## 1. Requisitos del Sistema y Requisitos Previos

### Requisitos Mínimos
- **Node.js**: `v18.0.0` o superior (probado en Node.js v20.x LTS y v24.x).
- **npm**: `v9.0.0` o superior.
- **Memoria RAM**: 2 GB mínimo (se recomiendan 4 GB para la ejecución concurrente de subagentes).
- **Espacio en Disco**: 200 MB de espacio libre para dependencias y la base de datos local SQLite.
- **Sistema Operativo**:
  - Windows 10/11 (64-bit)
  - macOS 12+ (Apple Silicon o Intel)
  - Ubuntu 22.04+ / Debian 11+ / Fedora 38+ / Arch Linux

### Entorno Antigravity (Opcional pero Recomendado)
Para la monitorización de sesiones y telemetría en vivo:
- Google Antigravity instalado en el sistema local.
- Directorio estándar de trabajo ubicado en `~/.gemini/antigravity/` (en Windows: `%USERPROFILE%\.gemini\antigravity`).
- Binario CLI de Antigravity `agy.exe` (en Windows habitualmente en `%LOCALAPPDATA%\agy\bin\agy.exe`).

> [!NOTE]
> Antigravity Apex funciona sin contratiempos incluso sin Antigravity en ejecución. En ausencia de Antigravity, el panel opera con seguimiento de tareas sin conexión, almacenamiento local en base de datos y telemetría simulada.

---

## 2. Instalación Manual Paso a Paso

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/fen3211/antigravity-apex.git
cd antigravity-apex
```

### Paso 2: Instalar Dependencias del Backend
```bash
npm install
```

### Paso 3: Instalar Dependencias del Cliente Frontend
```bash
npm --prefix client install
```

### Paso 4: Configurar Variables de Entorno
Copia la plantilla `.env.example` proporcionada a `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

En el primer arranque, si `COMMAND_CENTER_API_KEY` se deja en blanco, el servidor generará automáticamente un token criptográfico seguro de 32 bytes y lo guardará en `.env`.

### Paso 5: Desplegar Agentes y Habilidades de Antigravity
Despliega la suite completa de 17 agentes, reglas y habilidades en tu entorno Antigravity:

**Windows (PowerShell):**
```powershell
.\scripts\install.ps1 -Force
```

**macOS / Linux:**
```bash
./scripts/install.sh --force
```

---

## 3. Inicialización de la Base de Datos

La base de datos SQLite (`command_center.sqlite`) se inicializa automáticamente cuando el servidor arranca.

Características principales de la base de datos:
- **Motor**: `better-sqlite3` con enlaces nativos.
- **Modo de Diario**: **WAL (Write-Ahead Logging)** habilitado para lecturas concurrentes sin bloqueo y escrituras atómicas de alto rendimiento.
- **Pragmas**: `busy_timeout = 5000` para prevenir bloqueos de base de datos durante ráfagas rápidas de ingestión.
- **Tablas**: `tasks`, `events`, `settings`, `model_usage`, `session_token_usage`, `log_parse_state`, `legal_assessments`, `escalations`.

No se requieren scripts manuales de migración SQL.

---

## 4. Diagnóstico del Sistema (`npm run doctor`)

Ejecuta la comprobación diagnóstica completa en cualquier momento:

```bash
npm run doctor
```

Valida:
- Versiones de runtime de Node.js y npm
- Disponibilidad de Git y estado de la rama
- Modo WAL de SQLite e integridad del esquema
- Presencia de todas las 17 definiciones de agentes
- Reglas de orquestación y habilidades (`director-orchestration`, `argon-escalation`)
- Directorios de Antigravity (`brain`, `presence`, `knowledge`)

---

## 5. Verificación y Pruebas

Comprueba que tu instalación cumple con todos los requisitos operativos ejecutando la suite de pruebas:

```bash
npm test
```

Ejecuta las 8 suites de pruebas especializadas:
1. `tests/api.test.ts`: Seguridad de la API REST, CORS, autenticación y defensa contra inyección de CLI.
2. `tests/ingestion.test.ts`: Lector incremental de transmisiones, fragmentación de 64 KB y rotación de ficheros.
3. `tests/analytics.test.ts`: Métricas de tokens LIVE vs ESTIMATED y contabilidad de costes.
4. `tests/websocket-resilience.test.ts`: Autenticación WebSocket, límites de carga útil y latidos ping-pong.
5. `tests/process-supervisor.test.ts`: Creación de procesos de subagentes, timeouts con terminación de árbol y control de concurrencia.
6. `tests/legal-compliance.test.ts`: Motor de auditoría legal de la Puerta 2b a través de 16 escenarios normativos.
7. `tests/backend-audit.test.ts`: Descubrimiento multiplataforma, seguridad contra path traversal y comprobación de doctor.
8. `tests/intelligent-argon-escalation.test.ts`: Escalado de Nivel 4 a Argon, paquete de prompts de 18 puntos y enfriamiento antispam.

---

## 6. Modos de Ejecución

### Modo A: Modo de Desarrollo (Recarga en Caliente)
```bash
npm run dev
```

### Modo B: Lanzamiento Rápido en 1 Clic en Windows
Haz doble clic en [`start.cmd`](../start.cmd).

### Modo C: Compilación y Ejecución en Producción
```bash
npm run server:build
npm --prefix client run build
npm start
```
