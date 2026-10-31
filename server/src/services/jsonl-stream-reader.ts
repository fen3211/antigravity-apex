import fs from 'fs';
import path from 'path';
import { StringDecoder } from 'string_decoder';
import type { EventPayload, LogParseState } from '../types.js';

export interface QuantumReadResult {
  events: EventPayload[];
  updatedState: LogParseState;
  hasMore: boolean;
  linesInQuantum: number;
  newOffset: number;
}

export function extractConversationId(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  // Match .../brain/<convId>/.system_generated/...
  const matchBrain = normalized.match(/\/brain\/([^/]+)/i);
  if (matchBrain && matchBrain[1]) return matchBrain[1];

  const matchSys = normalized.match(/([^/]+)\/\.system_generated/i);
  if (matchSys && matchSys[1]) return matchSys[1];

  // Match /conversations/<convId>
  const matchConv = normalized.match(/\/conversations\/([^/]+)/i);
  if (matchConv && matchConv[1]) return matchConv[1];

  // Fallback: directory name
  const dir = path.dirname(filePath);
  const base = path.basename(dir);
  if (base !== 'logs' && base !== '.system_generated' && base !== '.' && base !== '') {
    return base;
  }
  const parent = path.basename(path.dirname(dir));
  if (parent && parent !== '.' && parent !== '.system_generated' && parent !== '') {
    return parent;
  }
  return 'default-session';
}

export function extractEventsFromTranscriptEntry(
  entry: any,
  convId: string,
  lineNumber: number = 0
): EventPayload[] {
  const events: EventPayload[] = [];
  const shortConv = (convId || 'unknown').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const stepIndex = entry.step_index !== undefined ? entry.step_index : lineNumber;
  const timestamp = entry.created_at || new Date().toISOString();

  // 1. Tool calls (invoke_subagent)
  if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
    for (let i = 0; i < entry.tool_calls.length; i++) {
      const call = entry.tool_calls[i];
      if (call.name === 'invoke_subagent') {
        const args = call.args || {};
        // Normalize args.TypeName: remove surrounding quotes if present
        const rawTypeName = typeof args.TypeName === 'string' ? args.TypeName : '';
        const typeName = rawTypeName.replace(/^"|"$/g, '').trim() || 'subagent';

        const rawRole = typeof args.Role === 'string' ? args.Role.replace(/^"|"$/g, '').trim() : undefined;
        const rawModel = typeof args.Model === 'string' ? args.Model.replace(/^"|"$/g, '').trim() : 'inherit';

        const toolSuffix = `_t${i}`;
        const eventId = `evt_${shortConv}_s${stepIndex}${toolSuffix}_agent_started`;

        events.push({
          id: eventId,
          timestamp,
          project_id: convId,
          agent_id: typeName,
          type: 'agent.started',
          source: 'LIVE_AGY',
          data: {
            role: rawRole || typeName,
            typeName,
            model: rawModel,
            promptSnippet: typeof args.Prompt === 'string' ? args.Prompt.slice(0, 150) : '',
            tokens: {
              input: entry.input_tokens || 0,
              output: entry.output_tokens || 0
            }
          }
        });
      }
    }
  }

  // 2. Errors
  if (entry.status === 'ERROR') {
    const toolSuffix = '';
    const eventId = `evt_${shortConv}_s${stepIndex}${toolSuffix}_agent_failed`;

    events.push({
      id: eventId,
      timestamp,
      project_id: convId,
      type: 'agent.failed',
      source: 'LIVE_AGY',
      data: {
        stepIndex: entry.step_index,
        error: entry.content ? String(entry.content).slice(0, 200) : 'Step execution error'
      }
    });
  }

  return events;
}

export class JsonlStreamReader {
  public static readonly CHUNK_SIZE = 64 * 1024; // 64 KB
  public static readonly MAX_LINE_SIZE = 5 * 1024 * 1024; // 5 MB

  public async readQuantum(
    filePath: string,
    currentState: LogParseState,
    maxLines: number = 50,
    maxTimeMs: number = 16
  ): Promise<QuantumReadResult> {
    const startTime = Date.now();
    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
    } catch (err: any) {
      return {
        events: [],
        updatedState: {
          ...currentState,
          status: 'ERROR',
          last_error: `File stat failed: ${err.message}`,
          last_parsed_at: new Date().toISOString()
        },
        hasMore: false,
        linesInQuantum: 0,
        newOffset: currentState.last_offset
      };
    }

    const convId = currentState.conversation_id || extractConversationId(filePath);
    let lastOffset = currentState.last_offset;
    let lastLineNumber = currentState.last_line_number;
    let errorCount = currentState.error_count;
    let lastError = currentState.last_error;
    let status = currentState.status;

    // Detect rotation or truncation:
    // 1. File size is smaller than lastOffset -> file was truncated/recreated
    // 2. Inode / FileIndex changed -> file was rotated or replaced
    // 3. Birthtime changed -> file was replaced
    const inodeChanged = Boolean(
      currentState.file_inode &&
      stat.ino &&
      String(stat.ino) !== '0' &&
      String(stat.ino) !== currentState.file_inode
    );
    const birthtimeChanged = currentState.file_birthtime_ms > 0 &&
      Math.abs(stat.birthtimeMs - currentState.file_birthtime_ms) > 50;

    if (stat.size < lastOffset || inodeChanged || birthtimeChanged) {
      console.warn(`[JsonlStreamReader] Rotation detected for ${filePath}. Resetting offset from ${lastOffset} to 0.`);
      lastOffset = 0;
      lastLineNumber = 0;
      status = 'ACTIVE';
    }

    // Nothing new to read
    if (stat.size <= lastOffset) {
      return {
        events: [],
        updatedState: {
          ...currentState,
          conversation_id: convId,
          last_offset: lastOffset,
          last_line_number: lastLineNumber,
          file_size: stat.size,
          file_inode: stat.ino ? String(stat.ino) : null,
          file_birthtime_ms: stat.birthtimeMs,
          file_mtime_ms: stat.mtimeMs,
          last_parsed_at: new Date().toISOString(),
          status: 'ACTIVE',
          error_count: errorCount,
          last_error: lastError
        },
        hasMore: false,
        linesInQuantum: 0,
        newOffset: lastOffset
      };
    }

    const events: EventPayload[] = [];
    let linesInQuantum = 0;
    let committedOffset = lastOffset;
    let readOffset = lastOffset;
    const decoder = new StringDecoder('utf8');
    let pendingFragment = '';
    const chunkBuffer = Buffer.alloc(JsonlStreamReader.CHUNK_SIZE);
    let skippingOversized = false;
    let loopStart = Date.now();

    let handle: fs.promises.FileHandle | null = null;
    try {
      try {
        handle = await fs.promises.open(filePath, 'r');
      } catch (openErr: any) {
        return {
          events: [],
          updatedState: {
            ...currentState,
            status: 'ERROR',
            error_count: errorCount + 1,
            last_error: `Failed to open file: ${openErr.message}`,
            last_parsed_at: new Date().toISOString()
          },
          hasMore: false,
          linesInQuantum: 0,
          newOffset: lastOffset
        };
      }

      loopStart = Date.now();
      while (readOffset < stat.size && linesInQuantum < maxLines && (linesInQuantum === 0 || (Date.now() - loopStart) < maxTimeMs)) {
        const bytesToRead = Math.min(JsonlStreamReader.CHUNK_SIZE, stat.size - readOffset);
        const { bytesRead } = await handle.read(chunkBuffer, 0, bytesToRead, readOffset);
        if (bytesRead === 0) break;

        readOffset += bytesRead;
        const decoded = decoder.write(chunkBuffer.subarray(0, bytesRead));
        pendingFragment += decoded;

        // Check OOM protection
        if (pendingFragment.length > JsonlStreamReader.MAX_LINE_SIZE) {
          console.warn(`[JsonlStreamReader] Max line size exceeded (5MB) in ${filePath} at offset ${readOffset}. Discarding fragment.`);
          errorCount++;
          lastError = `Max line size exceeded (5MB) around offset ${readOffset}`;
          pendingFragment = '';
          skippingOversized = true;
          committedOffset = readOffset;
        }

        // Extract lines
        let newlineIdx: number;
        while ((newlineIdx = pendingFragment.indexOf('\n')) !== -1) {
          const rawLineWithDelim = pendingFragment.substring(0, newlineIdx + 1);
          let rawLine = pendingFragment.substring(0, newlineIdx);
          if (rawLine.endsWith('\r')) {
            rawLine = rawLine.slice(0, -1);
          }
          pendingFragment = pendingFragment.substring(newlineIdx + 1);

          const lineBytes = Buffer.byteLength(rawLineWithDelim, 'utf8');
          committedOffset += lineBytes;

          if (skippingOversized) {
            // We just finished skipping the rest of the oversized line
            skippingOversized = false;
            continue;
          }

          lastLineNumber++;
          linesInQuantum++;

          const trimmed = rawLine.trim();
          if (trimmed.length > 0) {
            try {
              const parsed = JSON.parse(trimmed);
              const extracted = extractEventsFromTranscriptEntry(parsed, convId, lastLineNumber);
              events.push(...extracted);
            } catch (err: any) {
              console.error(`[JsonlStreamReader] JSON parse error in ${filePath} at line ${lastLineNumber}: ${err.message}`);
              errorCount++;
              lastError = `JSON parse error at line ${lastLineNumber}: ${err.message}`;
              // Continue parsing next lines!
            }
          }

          if (linesInQuantum >= maxLines || (Date.now() - loopStart) >= maxTimeMs) {
            break;
          }
        }
      }

      // Check EOF without trailing newline (e.g. valid JSON line at end of file)
      if (readOffset >= stat.size && pendingFragment.trim().length > 0 && !skippingOversized && linesInQuantum < maxLines) {
        const trimmed = pendingFragment.trim();
        try {
          const parsed = JSON.parse(trimmed);
          lastLineNumber++;
          linesInQuantum++;
          committedOffset = stat.size;
          pendingFragment = '';
          const extracted = extractEventsFromTranscriptEntry(parsed, convId, lastLineNumber);
          events.push(...extracted);
        } catch {
          // Incomplete trailing fragment still being written by external process;
          // committedOffset remains at the end of the last complete newline.
        }
      }

    } finally {
      if (handle) {
        await handle.close();
      }
    }

    const hitQuantumLimit = linesInQuantum >= maxLines || (Date.now() - loopStart) >= maxTimeMs;
    const hasMore = hitQuantumLimit && committedOffset < stat.size;

    const updatedState: LogParseState = {
      file_path: filePath,
      conversation_id: convId,
      last_offset: committedOffset,
      last_line_number: lastLineNumber,
      file_size: stat.size,
      file_inode: stat.ino ? String(stat.ino) : null,
      file_birthtime_ms: stat.birthtimeMs,
      file_mtime_ms: stat.mtimeMs,
      last_parsed_at: new Date().toISOString(),
      status: errorCount > currentState.error_count && events.length === 0 ? 'ERROR' : 'ACTIVE',
      error_count: errorCount,
      last_error: lastError
    };

    return {
      events,
      updatedState,
      hasMore,
      linesInQuantum,
      newOffset: committedOffset
    };
  }
}

export const jsonlStreamReader = new JsonlStreamReader();
