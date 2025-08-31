/**
 * Base TypeScript interfaces for business-friendly API testing
 * Defines clear contracts between modules and components for the API testing workflow
 */

/**
 * Represents a placeholder in the JSON payload that can be replaced with user input
 */
export interface Placeholder {
  /** Unique identifier for the placeholder */
  name: string;
  /** Human-readable description for business users */
  description?: string;
  /** Example value to help users understand expected input */
  example?: string | number;
  /** JSONPath-like or dot notation path to the field in the payload */
  path: string;
}

/**
 * Maps a field path to a business-friendly alias for display purposes
 */
export interface FieldMapping {
  /** JSONPath or dot notation path to the field */
  path: string;
  /** Business-friendly alias to display instead of the technical field name */
  alias: string;
  /** Whether this field comes from request or response */
  type?: 'request' | 'response';
}

/**
 * Records a complete API request execution with all metadata
 */
export interface RequestRecord {
  /** Unique identifier for this request execution */
  id: string;
  /** API endpoint URL */
  endpoint: string;
  /** HTTP method used */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** The resolved payload after placeholder substitution */
  payloadResolved: object;
  /** The placeholder values used in this execution */
  placeholders: Record<string, unknown>;
  /** HTTP response status code */
  status: number;
  /** Request execution duration in milliseconds */
  durationMs: number;
  /** Unix timestamp of when the request was executed */
  timestamp: number;
  /** The response body from the API */
  response: object | string;
  /** Error message if the request failed */
  error?: string;
}

/**
 * Template structure for CSV download and import
 */
export interface CsvTemplate {
  /** Column headers corresponding to placeholder names */
  headers: string[];
  /** Sample row with example values for each placeholder */
  sampleRow: Record<string, string>;
}

/**
 * Represents a single row in the results report with business-friendly aliases
 */
export interface ReportRow {
  /** Reference to the original request record */
  requestId: string;
  /** Field values mapped to their business-friendly aliases */
  values: Record<string, string>;
}

/**
 * Result of executing an API request
 */
export interface ExecutionResult {
  /** Whether the execution was successful */
  success: boolean;
  /** The complete request record if successful */
  record?: RequestRecord;
  /** Error details if execution failed */
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Configuration for bulk CSV execution
 */
export interface BulkExecutionConfig {
  /** The placeholders configuration */
  placeholders: Placeholder[];
  /** Base API endpoint */
  endpoint: string;
  /** HTTP method to use */
  method: RequestRecord['method'];
  /** Base JSON payload template */
  payloadTemplate: object;
}

/**
 * Status of bulk execution for CSV import
 */
export interface BulkExecutionStatus {
  /** Total number of rows to process */
  total: number;
  /** Number of successfully processed rows */
  completed: number;
  /** Number of rows that failed processing */
  failed: number;
  /** Currently processing row number */
  current?: number;
  /** Detailed results for each row */
  results: Array<{
    rowIndex: number;
    success: boolean;
    record?: RequestRecord;
    error?: string;
  }>;
}

/**
 * Validation result for CSV import
 */
export interface CsvValidationResult {
  /** Whether the CSV is valid overall */
  isValid: boolean;
  /** Total number of rows found */
  totalRows: number;
  /** Validation errors by row number */
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  /** Missing required headers */
  missingHeaders: string[];
  /** Extra headers not in placeholders */
  extraHeaders: string[];
}
