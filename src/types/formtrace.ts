// ─── Severity ─────────────────────────────────────────────────────────────────

export type Severity = 'low' | 'medium' | 'high';

// ─── Field & Form snapshots ────────────────────────────────────────────────────

/** Safe, privacy-preserving snapshot of a single form field. */
export interface FieldSnapshot {
  tag: string;            // e.g. 'input', 'textarea', 'select'
  type: string;           // e.g. 'text', 'email', 'password', 'checkbox'
  name: string;
  id: string;
  label: string;          // associated <label> text if found
  required: boolean;
  disabled: boolean;
  hidden: boolean;        // visually hidden or display:none
  valid: boolean;
  validationMessage: string;
  // INSTÄLLNING - 'empty' or 'present' — never stores the actual value
  valueState: 'empty' | 'present';
}

/** Snapshot of a <form> element at a moment in time. */
export interface FormSnapshot {
  index: number;          // positional index on the page
  id: string;
  action: string;
  method: string;
  fields: FieldSnapshot[];
  hasVisibleError: boolean;
  submitButtonDisabled: boolean;
  submitButtonExists: boolean;
}

// ─── Recorded events ──────────────────────────────────────────────────────────

export type RecordedEventType =
  | 'form-submit'
  | 'submit-click'
  | 'input-change'
  | 'form-invalid'
  | 'network-failure'
  | 'console-error'
  | 'mutation'
  | 'page-snapshot'
  | 'disabled-submit-attempt'
  | 'network-probe-status'
  | 'network-failure-dom-signal';

export interface RecordedEvent {
  type: RecordedEventType;
  timestamp: number;
  formIndex?: number;
  fieldName?: string;
  fieldType?: string;
  fieldId?: string;
  message?: string;       // console error text or network URL
  status?: number;        // HTTP status for network failures
  url?: string;           // for network events
  snapshot?: FormSnapshot;
  tagName?: string;
  buttonText?: string;
  disabled?: boolean;
  formId?: string;
  formName?: string;
  method?: string;
  statusText?: string;
}

// ─── Recording session ────────────────────────────────────────────────────────

export interface RecordingSession {
  id: string;
  startedAt: number;
  stoppedAt?: number;
  pageUrl: string;
  pageTitle: string;
  formCount: number;
  events: RecordedEvent[];
  submitAttemptCount: number;
  /** Clicks on a submit button that were NOT followed by a form-submit event */
  clickWithoutSubmitCount: number;
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface Finding {
  code: string;           // machine-readable code, e.g. 'DISABLED_SUBMIT'
  label: string;          // human-readable label
  severity: Severity;
  detail: string;
}

export interface AnalysisReport {
  sessionId: string;
  timestamp: string;      // ISO string
  pageUrl: string;
  pageTitle: string;
  formCount: number;
  submitAttemptCount: number;
  eventCount: number;
  likelyIssue: string;
  confidenceScore: number;  // 0–100
  severity: Severity;
  summary: string;
  findings: Finding[];
  technicalDetails: string[];
  suggestedFixes: string[];
}

// ─── Message passing ──────────────────────────────────────────────────────────

export type MessageType =
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'RESET_SESSION'
  | 'GET_STATUS'
  | 'STATUS_UPDATE'
  | 'SESSION_DATA'
  | 'RECORD_EVENT'
  | 'PAGE_INFO'
  | 'GET_SESSION';

export interface BaseMessage {
  type: MessageType;
}

export interface StartRecordingMessage extends BaseMessage {
  type: 'START_RECORDING';
}

export interface StopRecordingMessage extends BaseMessage {
  type: 'STOP_RECORDING';
}

export interface ResetSessionMessage extends BaseMessage {
  type: 'RESET_SESSION';
}

export interface GetStatusMessage extends BaseMessage {
  type: 'GET_STATUS';
}

export interface StatusUpdateMessage extends BaseMessage {
  type: 'STATUS_UPDATE';
  isRecording: boolean;
  formCount: number;
  eventCount: number;
  submitAttemptCount: number;
}

export interface SessionDataMessage extends BaseMessage {
  type: 'SESSION_DATA';
  session: RecordingSession;
}

export interface RecordEventMessage extends BaseMessage {
  type: 'RECORD_EVENT';
  event: RecordedEvent;
}

export interface PageInfoMessage extends BaseMessage {
  type: 'PAGE_INFO';
  pageUrl: string;
  pageTitle: string;
  formCount: number;
}

export interface GetSessionMessage extends BaseMessage {
  type: 'GET_SESSION';
}

export type FormTraceMessage =
  | StartRecordingMessage
  | StopRecordingMessage
  | ResetSessionMessage
  | GetStatusMessage
  | StatusUpdateMessage
  | SessionDataMessage
  | RecordEventMessage
  | PageInfoMessage
  | GetSessionMessage;
