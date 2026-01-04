# PR Review Checklists

Detailed checklists for common PR types. Use these as reference when performing reviews.

## Universal Checklist (All PRs)

### Code Quality
- [ ] No `any` types (use proper TypeScript types)
- [ ] No unused imports or variables
- [ ] No commented-out code blocks
- [ ] Consistent naming (camelCase for variables, PascalCase for components)
- [ ] No magic numbers/strings (use constants or config)
- [ ] Functions are reasonably sized (<50 lines preferred)
- [ ] No duplicate code that should be abstracted

### Security
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] No sensitive data logged to console
- [ ] User input is validated before use
- [ ] SQL/NoSQL queries use parameterized inputs
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Auth checks on protected routes/endpoints

### Project Conventions
- [ ] Types imported from `andamio-db-api` (not locally defined)
- [ ] Variable naming follows CLAUDE.md rules (no `module` alone)
- [ ] Module references use canonical identifiers (module code, not title)
- [ ] SLT references use `<module-code>.<module-index>` format

---

## UI/Component Changes

### Styling Rules (per CLAUDE.md)
- [ ] Using `~/components/andamio/` imports (not `~/components/ui/`)
- [ ] Components use `Andamio` prefix (e.g., `AndamioButton`, not `Button`)
- [ ] No custom className on Andamio components
- [ ] No hardcoded colors (`text-blue-600` → `text-primary`)
- [ ] Using semantic colors only (see semantic-colors.md)

### Responsive Design
- [ ] Using `AndamioPageHeader` for page titles
- [ ] Using `AndamioSectionHeader` for section titles
- [ ] Using `AndamioTableContainer` for tables
- [ ] Flex containers stack on mobile (`flex-col sm:flex-row`)
- [ ] Text scales appropriately (`text-2xl sm:text-3xl`)

### State Management
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled (use `AndamioEmptyState`)
- [ ] No flickering/layout shift on load

### Accessibility
- [ ] Interactive elements have accessible names
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## API Integration Changes

### Data Fetching
- [ ] Using `authenticatedFetch` for protected endpoints
- [ ] Proper error handling with try/catch
- [ ] Loading states while fetching
- [ ] Types match API response (`as TypeFromDbApi`)

### New Endpoints
- [ ] Endpoint documented in API coverage docs
- [ ] Proper HTTP method used (GET for reads, POST/PUT for writes)
- [ ] Request/response types defined
- [ ] Error responses handled

### Authentication
- [ ] Auth check before protected operations
- [ ] JWT expiration handled gracefully
- [ ] Logout clears all auth state

---

## Hook Changes

### Custom Hooks
- [ ] Hook name starts with `use`
- [ ] Dependencies array is complete and correct
- [ ] Cleanup function provided if needed (effects)
- [ ] Memoization used appropriately (useMemo/useCallback)
- [ ] No infinite loops from missing/wrong dependencies

### State Updates
- [ ] Using functional updates when depending on previous state
- [ ] Not mutating state directly
- [ ] Batch updates where possible

---

## Database/Schema Changes

### Prisma Schema
- [ ] Migration generated and committed
- [ ] Migration is reversible if needed
- [ ] Indexes added for queried fields
- [ ] Relations properly defined
- [ ] Default values make sense

### Data Integrity
- [ ] Required fields have validation
- [ ] Cascade deletes configured correctly
- [ ] No orphaned records possible

---

## Documentation Changes

### Markdown Quality
- [ ] Headers use proper hierarchy (h1 → h2 → h3)
- [ ] Code blocks have language specified
- [ ] Links are valid and accessible
- [ ] No broken images

### Content
- [ ] Accurate and up-to-date
- [ ] Examples are working
- [ ] References to code paths are correct
- [ ] Changelog updated for user-facing changes

---

## Test Changes

### Test Quality
- [ ] Tests are meaningful (not just for coverage)
- [ ] Edge cases covered
- [ ] Mocks are minimal and appropriate
- [ ] Tests are isolated (no shared state)
- [ ] Descriptive test names

### Coverage
- [ ] New features have tests
- [ ] Bug fixes include regression tests
- [ ] Critical paths remain covered

---

## PR Size Guidelines

| Size | Lines Changed | Files | Recommendation |
|------|---------------|-------|----------------|
| XS | <50 | <3 | Easy to review |
| S | 50-150 | 3-5 | Good size |
| M | 150-300 | 5-10 | Acceptable |
| L | 300-500 | 10-20 | Consider splitting |
| XL | >500 | >20 | Should be split |

### Signs a PR Should Be Split
- Multiple unrelated features
- Refactoring mixed with new features
- Bug fixes combined with enhancements
- Large dependency updates with code changes

---

## Common Issues by Category

### UI Issues
```typescript
// BAD: Raw shadcn import
import { Button } from "~/components/ui/button";

// GOOD: Andamio wrapper
import { AndamioButton } from "~/components/andamio";
```

```typescript
// BAD: Hardcoded color
<span className="text-green-500">Success</span>

// GOOD: Semantic color
<span className="text-success">Success</span>
```

### API Issues
```typescript
// BAD: Local type definition
interface Course { id: string; title: string; }

// GOOD: Import from API package
import { type CourseOutput } from "andamio-db-api";
```

```typescript
// BAD: No error handling
const data = await fetch(url).then(r => r.json());

// GOOD: Proper error handling
try {
  const response = await authenticatedFetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json() as ExpectedType;
} catch (error) {
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

### Hook Issues
```typescript
// BAD: Missing dependency
useEffect(() => {
  fetchData(id);
}, []); // Missing 'id' dependency

// GOOD: Complete dependencies
useEffect(() => {
  fetchData(id);
}, [id]);
```

### Naming Issues
```typescript
// BAD: Reserved word as variable
const [module, setModule] = useState(null);

// GOOD: Specific name
const [courseModule, setCourseModule] = useState(null);
```
