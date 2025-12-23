# Implementation Plan: Document Preprocessing, Validation Layers & Data Integrity

## Overview

This plan addresses document preprocessing for the 215-page PDF, implements quality control and validation layers, adds dynamic tax rate extraction, integrates rate guards in system prompts, and prevents data injection attacks.

---

## Phase 1: Document Preprocessing & State Management

### 1.1 Enhanced Document Ingestion Pipeline

**File**: `src/lib/utils/document-ingestion.ts`

**Changes**:

- Add progress tracking for 215-page document processing
- Implement chunking validation (ensure all pages are processed)
- Add quality checks after chunking (verify chunk integrity)
- Store processing metadata (processing time, chunk count, validation status)

**New Functions**:

```typescript
type ProcessingProgress = {
  stage:
    | "extracting"
    | "normalizing"
    | "chunking"
    | "indexing"
    | "validating"
    | "complete";
  progress: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  message?: string;
};

async function ingestDocumentWithProgress(
  source: File | string,
  onProgress?: (progress: ProcessingProgress) => void,
  options?: { forceReingest?: boolean }
): Promise<IngestedDocument>;
```

### 1.2 Document State Store

**New File**: `src/lib/store/useDocumentStore.ts`

**Purpose**: Track document loading state, processing status, and errors

**State**:

```typescript
type DocumentState = {
  isLoaded: boolean;
  isProcessing: boolean;
  processingProgress: ProcessingProgress | null;
  lastError: string | null;
  documentHash: string | null;
  processedAt: number | null;
  chunkCount: number | null;
  validationStatus: "pending" | "valid" | "invalid" | "error";
};
```

**Actions**:

- `setProcessing(progress)`
- `setLoaded(document)`
- `setError(error)`
- `reset()`
- `retryLoad()`

---

## Phase 2: Dynamic Tax Rate Extraction & Validation

### 2.1 Tax Rate Extractor

**New File**: `src/lib/utils/tax-rate-extractor.ts`

**Purpose**: Dynamically extract tax rates from document chunks (not hardcoded)

**Functions**:

```typescript
type ExtractedTaxRate = {
  threshold: number;
  rate: number;
  section?: string;
  pageNumber?: number;
  confidence: number; // 0-1
  source: string; // chunk content
};

/**
 * Extract tax rates from document chunks
 * Searches for patterns like "First N800,000 at 0%", "Next N2,200,000 at 15%", etc.
 */
async function extractTaxRatesFromDocument(
  document: IngestedDocument
): Promise<ExtractedTaxRate[]>;

/**
 * Validate extracted rates against known patterns
 */
function validateExtractedRates(rates: ExtractedTaxRate[]): {
  valid: boolean;
  errors: string[];
  validatedRates: ExtractedTaxRate[];
};
```

**Pattern Matching**:

- Regex patterns for rate extraction:
  - `First N(\d{1,3}(?:,\d{3})*|\d+) at (\d+)%`
  - `Next N(\d{1,3}(?:,\d{3})*|\d+) at (\d+)%`
  - `Above N(\d{1,3}(?:,\d{3})*|\d+) at (\d+)%`
  - Section 30 references

**Validation Rules**:

- Must have at least 6 rate bands
- First band must be 0%
- Rates must be progressive (increasing)
- Thresholds must be sequential
- Must match expected structure

### 2.2 Rate Validation Layer

**New File**: `src/lib/utils/rate-validator.ts`

**Purpose**: Validate AI responses and document chunks against extracted rates

**Functions**:

```typescript
type RateValidationResult = {
  isValid: boolean;
  detectedRates: Array<{ threshold: number; rate: number; source: string }>;
  discrepancies: Array<{ expected: string; found: string; location: string }>;
  confidence: number;
};

/**
 * Validate text content against authoritative tax rates
 */
function validateRatesInContent(
  content: string,
  authoritativeRates: ExtractedTaxRate[]
): RateValidationResult;

/**
 * Filter chunks that contain incorrect rate information
 */
function filterInvalidRateChunks(
  chunks: Chunk[],
  authoritativeRates: ExtractedTaxRate[]
): { valid: Chunk[]; invalid: Chunk[] };
```

---

## Phase 3: System Prompt Enhancement with Rate Guards

### 3.1 Rate Guard Generator

**New File**: `src/lib/utils/rate-guard.ts`

**Purpose**: Generate rate guard strings for system prompt

**Functions**:

```typescript
/**
 * Generate authoritative rate guard strings from extracted rates
 * Returns array of strings to include in system prompt
 */
function generateRateGuards(rates: ExtractedTaxRate[]): string[];

/**
 * Format rates as guard strings
 * Example: ["First N800,000 at 0%", "Next N2,200,000 at 15%", ...]
 */
function formatRateGuards(rates: ExtractedTaxRate[]): string[];
```

**Output Format**:

```typescript
const rateGuards = [
  "First N800,000 at 0%",
  "Next N2,200,000 at 15%",
  "Next N9,000,000 at 18%",
  "Next N13,000,000 at 21%",
  "Next N25,000,000 at 23%",
  "Above N50,000,000 at 25%",
];
```

### 3.2 Enhanced System Prompt

**File**: `src/lib/utils/prompt-prime.ts`

**Changes**:

- Import rate guard generator
- Extract rates from document after ingestion
- Add rate guards to system prompt
- Add validation instructions

**New Prompt Section**:

```typescript
AUTHORITATIVE TAX RATES (Section 30 - Personal Income Tax):
${rateGuards.join('\n')}

CRITICAL: These rates are the source of truth. If document excerpts contain
different rates, prioritize these authoritative rates. Always use these rates
when answering questions about tax calculations.
```

---

## Phase 4: Document Loading UI & Retry Mechanism

### 4.1 Document Status Component

**New File**: `src/components/atoms/document-status-banner.tsx`

**Purpose**: Floating banner at top showing document loading status

**Features**:

- Shows when document is processing
- Shows error state with retry button
- Auto-dismisses when loaded successfully
- Floating position (fixed at top)
- Accessible (ARIA labels, keyboard navigation)

**States**:

- `processing`: Shows progress
- `error`: Shows error message + retry button
- `success`: Auto-dismisses after 3 seconds
- `hidden`: When document is loaded and validated

**Props**:

```typescript
type DocumentStatusBannerProps = {
  status: "processing" | "error" | "success" | "hidden";
  progress?: ProcessingProgress;
  error?: string;
  onRetry?: () => void;
};
```

### 4.2 Integration in Chat Page

**File**: `src/pages/chat.tsx`

**Changes**:

- Import `useDocumentStore`
- Import `DocumentStatusBanner`
- Add banner component at top of page
- Handle retry action
- Show banner when document not loaded

**Layout**:

```tsx
<DocumentStatusBanner
  status={documentStatus}
  progress={processingProgress}
  error={lastError}
  onRetry={handleRetryDocumentLoad}
/>
```

---

## Phase 5: Data Injection Prevention

### 5.1 Content Sanitization Layer

**New File**: `src/lib/utils/content-sanitizer.ts`

**Purpose**: Prevent malicious data injection in document chunks

**Functions**:

```typescript
type SanitizationResult = {
  sanitized: string;
  removed: string[];
  warnings: string[];
};

/**
 * Sanitize chunk content to prevent injection
 */
function sanitizeChunkContent(content: string): SanitizationResult;

/**
 * Validate chunk content structure
 */
function validateChunkStructure(chunk: Chunk): {
  valid: boolean;
  errors: string[];
};
```

**Sanitization Rules**:

- Remove script tags
- Escape HTML entities
- Validate rate patterns
- Remove suspicious patterns
- Preserve legitimate content

### 5.2 Rate Injection Prevention

**File**: `src/lib/utils/rate-validator.ts` (extend)

**New Functions**:

```typescript
/**
 * Detect potential rate injection attempts
 */
function detectRateInjection(
  content: string,
  authoritativeRates: ExtractedTaxRate[]
): { isInjection: boolean; suspiciousPatterns: string[] };

/**
 * Sanitize rates in content
 */
function sanitizeRatesInContent(
  content: string,
  authoritativeRates: ExtractedTaxRate[]
): string;
```

### 5.3 Query Validation

**File**: `src/lib/utils/document-query.ts` (extend)

**Changes**:

- Validate query strings for injection attempts
- Filter results that contain suspicious content
- Add confidence scoring based on rate accuracy

**New Functions**:

```typescript
function validateQuery(query: string): { valid: boolean; sanitized: string };

function filterSuspiciousChunks(
  results: QueryResult[],
  authoritativeRates: ExtractedTaxRate[]
): QueryResult[];
```

---

## Phase 6: Quality Control & Validation Pipeline

### 6.1 Document Quality Validator

**New File**: `src/lib/utils/document-validator.ts`

**Purpose**: Comprehensive document quality checks

**Functions**:

```typescript
type DocumentQualityReport = {
  isValid: boolean;
  score: number; // 0-100
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  warnings: string[];
  errors: string[];
};

/**
 * Validate document after ingestion
 */
async function validateDocumentQuality(
  document: IngestedDocument,
  authoritativeRates: ExtractedTaxRate[]
): Promise<DocumentQualityReport>;
```

**Validation Checks**:

1. **Chunk Integrity**: All chunks have valid structure
2. **Rate Extraction**: Successfully extracted at least 6 rates
3. **Rate Validation**: Extracted rates match expected patterns
4. **Content Completeness**: All pages processed
5. **Index Quality**: Search index is functional
6. **Rate Consistency**: No conflicting rate information
7. **Injection Detection**: No suspicious patterns detected

### 6.2 Chunk Quality Scoring

**New File**: `src/lib/utils/chunk-quality.ts`

**Functions**:

```typescript
type ChunkQualityScore = {
  score: number; // 0-100
  factors: {
    rateAccuracy: number;
    structureIntegrity: number;
    contentCompleteness: number;
    injectionRisk: number;
  };
};

function scoreChunkQuality(
  chunk: Chunk,
  authoritativeRates: ExtractedTaxRate[]
): ChunkQualityScore;
```

---

## Phase 7: Integration & Initialization Flow

### 7.1 Enhanced Initialization

**File**: `src/lib/initialize.ts`

**Changes**:

- Initialize document store
- Start document ingestion with progress tracking
- Extract tax rates after ingestion
- Validate document quality
- Handle errors gracefully

**Flow**:

```
1. Initialize user store
2. Initialize token store
3. Start document ingestion (with progress)
4. Extract tax rates from document
5. Validate document quality
6. Store rates in document store
7. Mark document as ready
```

### 7.2 Document Manager Updates

**File**: `src/lib/utils/document-manager.ts`

**Changes**:

- Integrate rate extraction
- Add quality validation
- Export document state
- Add retry mechanism

**New Functions**:

```typescript
async function loadDocumentWithValidation(
  source: File | string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{
  document: IngestedDocument;
  rates: ExtractedTaxRate[];
  quality: DocumentQualityReport;
}>;

function getExtractedRates(): ExtractedTaxRate[] | null;
```

---

## Implementation Order

### Step 1: Foundation (Phase 1)

1. Create document state store
2. Enhance document ingestion with progress
3. Add processing metadata

### Step 2: Rate Extraction (Phase 2)

1. Create rate extractor
2. Implement pattern matching
3. Add validation logic

### Step 3: UI Components (Phase 4)

1. Create document status banner
2. Integrate in chat page
3. Add retry functionality

### Step 4: System Prompt (Phase 3)

1. Create rate guard generator
2. Update system prompt
3. Test rate guard integration

### Step 5: Validation Layers (Phase 6)

1. Create document validator
2. Implement quality checks
3. Add chunk quality scoring

### Step 6: Security (Phase 5)

1. Create content sanitizer
2. Add injection detection
3. Implement query validation

### Step 7: Integration (Phase 7)

1. Update initialization flow
2. Integrate all components
3. End-to-end testing

---

## Testing Strategy

### Unit Tests

- Rate extraction patterns
- Validation logic
- Sanitization functions
- Quality scoring

### Integration Tests

- Document ingestion flow
- Rate extraction from real document
- System prompt generation
- UI component rendering

### E2E Tests

- Full document load
- Error handling and retry
- Rate guard effectiveness
- Injection prevention

---

## Files to Create

1. `src/lib/store/useDocumentStore.ts` - Document state management
2. `src/lib/utils/tax-rate-extractor.ts` - Dynamic rate extraction
3. `src/lib/utils/rate-validator.ts` - Rate validation
4. `src/lib/utils/rate-guard.ts` - Rate guard generation
5. `src/lib/utils/content-sanitizer.ts` - Content sanitization
6. `src/lib/utils/document-validator.ts` - Document quality validation
7. `src/lib/utils/chunk-quality.ts` - Chunk quality scoring
8. `src/components/atoms/document-status-banner.tsx` - UI component

## Files to Modify

1. `src/lib/utils/document-ingestion.ts` - Add progress tracking
2. `src/lib/utils/prompt-prime.ts` - Add rate guards to prompt
3. `src/lib/utils/document-manager.ts` - Add validation and rate extraction
4. `src/lib/utils/document-query.ts` - Add injection prevention
5. `src/lib/initialize.ts` - Enhanced initialization
6. `src/pages/chat.tsx` - Add document status banner

---

## Success Criteria

✅ Document processes all 215 pages successfully
✅ Tax rates extracted dynamically from document
✅ Rate guards added to system prompt as array of strings
✅ Document status banner shows with retry on error
✅ Quality validation catches issues
✅ Injection attempts are prevented
✅ AI responses use correct rates (validated)
✅ No hardcoded rates (all dynamic from document)

---

## Risk Mitigation

1. **Document Processing Fails**: Retry mechanism + error handling
2. **Rate Extraction Fails**: Fallback to manual rate definition
3. **Validation Too Strict**: Configurable thresholds
4. **Performance Issues**: Progress tracking + chunking optimization
5. **Injection Bypass**: Multiple validation layers

---

## Notes

- All tax rates will be extracted dynamically from the document
- Rate guards will be generated as array of strings
- Validation happens at multiple layers (pre, during, post)
- User gets clear feedback on document status
- Retry mechanism allows recovery from errors
- Injection prevention uses defense-in-depth approach
