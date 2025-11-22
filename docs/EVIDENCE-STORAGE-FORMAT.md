# Assignment Evidence Storage Format

**Status**: Proposed Change - Team Discussion Needed
**Date**: 2025-01-22
**Context**: Assignment commitment evidence storage consistency

## Problem

Assignment evidence (`networkEvidence`) is currently stored in **inconsistent formats**:

### Current State (Observed in Production Data)
```javascript
// Commitment 1: Native JSON object
{
  "networkEvidence": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{"text": "Good ideas...", "type": "text"}]
      }
    ]
  }
}

// Commitment 2: Stringified JSON
{
  "networkEvidence": "{\"type\":\"doc\",\"content\":[...]}"
}
```

### Root Cause
Different save operations used different formats:

| Operation | Previous Format | Line |
|-----------|----------------|------|
| Save Draft | `editor.getHTML()` → HTML string | 237 |
| Initial Commit | `JSON.stringify(evidenceContent)` → stringified JSON | 450 |
| Update Existing | `editor?.getHTML()` → HTML string | 552 |

This created inconsistent data that required complex parsing logic on read.

## Solution Implemented (Frontend)

All save operations now use **Tiptap JSON format consistently**:

### Changes Made

1. **Save Draft** (`handleUpdateEvidence`)
   ```typescript
   // Before
   const evidenceContent = editor.getHTML();

   // After
   const evidenceContent = editor.getJSON();
   ```

2. **Initial Commit** (COMMIT_TO_ASSIGNMENT)
   ```typescript
   // Before
   assignmentEvidence: JSON.stringify(evidenceContent)

   // After
   assignmentEvidence: evidenceContent // Tiptap JSON object
   ```

3. **Update Existing** (COMMIT_TO_ASSIGNMENT)
   ```typescript
   // Before
   assignmentEvidence: editor?.getHTML() ?? ""

   // After
   assignmentEvidence: editor?.getJSON() ?? {}
   ```

4. **Content Hashing**
   ```typescript
   // Before
   const evidenceHash = `hash-${Date.now()}`; // Not deterministic

   // After
   const evidenceHash = hashNormalizedContent(evidenceContent); // Deterministic
   ```

## Required Database API Changes

### 1. Prisma Schema Update

**Current** (assumed):
```prisma
model AssignmentCommitment {
  networkEvidence     String?  // or Text
  networkEvidenceHash String?
  // ...
}
```

**Recommended**:
```prisma
model AssignmentCommitment {
  networkEvidence     Json?    // Use native JSON type
  networkEvidenceHash String?
  // ...
}
```

### 2. API Endpoint Updates

Ensure all endpoints that accept `networkEvidence` expect **JSON objects**, not strings:

```typescript
// ✅ Correct
{
  networkEvidence: {
    type: "doc",
    content: [...]
  }
}

// ❌ Incorrect
{
  networkEvidence: "{\"type\":\"doc\",\"content\":[...]}"
}
```

### 3. Validation

Add Zod schema validation for Tiptap JSON structure:

```typescript
const TiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.any()).optional(),
});

const UpdateEvidenceSchema = z.object({
  networkEvidence: TiptapDocSchema,
  networkEvidenceHash: z.string(),
});
```

## Benefits

### Consistency
- ✅ Single source of truth for evidence format
- ✅ No more parsing logic to handle multiple formats
- ✅ Predictable data structure across the application

### Performance
- ✅ PostgreSQL JSONB is optimized for JSON storage and querying
- ✅ Can query within evidence structure if needed
- ✅ More efficient than storing stringified JSON as TEXT

### Developer Experience
- ✅ Type safety with TypeScript
- ✅ Easier debugging (can inspect structure in DB tools)
- ✅ Simpler code - no stringify/parse dance

### Flexibility
- ✅ Can convert Tiptap JSON to any format (HTML, Markdown, plain text)
- ✅ Preserves document structure for future features
- ✅ Easier to migrate or export data

## Migration Considerations

### Backward Compatibility

The current implementation **handles both old and new formats** on read:

```typescript
// Load evidence into editor (handles legacy formats)
if (typeof networkEvidence === "string") {
  try {
    const parsed = JSON.parse(networkEvidence);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      content = parsed; // Tiptap JSON
    } else {
      content = networkEvidence; // HTML or plain text
    }
  } catch {
    content = networkEvidence; // HTML or plain text
  }
} else {
  content = networkEvidence; // Already JSON object
}
```

### Migration Options

**Option 1: Gradual Migration (Recommended)**
- Keep backward-compatible read logic
- All new saves use JSON format
- Old data gets converted on next update
- No breaking changes

**Option 2: One-time Migration**
- Write migration script to convert all existing evidence
- Remove backward-compatible read logic
- Cleaner codebase, but requires downtime/coordination

**Option 3: Dual Format (Not Recommended)**
- Continue supporting both formats indefinitely
- More complex code maintenance
- Technical debt accumulation

## Discussion Points for Team

1. **Database Schema**: Confirm Prisma schema change from `String` to `Json` type
2. **Migration Strategy**: Which migration option to pursue?
3. **API Versioning**: Does this warrant an API version bump?
4. **Testing**: Need to test with existing production data
5. **Documentation**: Update API docs to reflect JSON-only format
6. **Blockchain Hash**: Confirm `assignment_info` hash is working correctly with JSON

## Next Steps

- [ ] Team reviews this proposal
- [ ] Decide on migration strategy
- [ ] Update database API Prisma schema
- [ ] Update API endpoint validation
- [ ] Test with production data snapshot
- [ ] Update API documentation
- [ ] Create migration script (if Option 2 chosen)
- [ ] Deploy coordinated release (frontend + backend)

## Related Files

### Frontend (T3 App)
- `src/components/learner/assignment-commitment.tsx` - Main component
- `src/components/content-display.tsx` - Read-only evidence display
- `src/lib/hashing.ts` - Content hashing utilities

### Backend (Database API)
- `prisma/schema.prisma` - Database schema
- Assignment commitment CRUD endpoints
- Validation schemas

## References

- [Tiptap JSON Format](https://tiptap.dev/guide/output#option-1-json)
- [PostgreSQL JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- [Prisma Json Type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)
