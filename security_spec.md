# Evan Tracker - Security Specification

## 1. Data Invariants
- Each baby event (Feeding, Diaper, Sleep, Inventory, Medical) must belong to a valid `familyId`.
- Users can only read and write events if they are authenticated members of the family (`memberUids`) or the admin.
- Stock deductions must only occur within the family's inventory subcollection.
- Default deny prevents any unauthorized read or write to non-family resources.

## 2. The Dirty Dozen Payloads & Test Scenarios
1. Unauthenticated read on `/families/fam123/feedings` -> DENIED
2. Unauthenticated write to `/families/fam123/feedings/feed1` -> DENIED
3. Member of `famA` attempting to read `/families/famB/feedings` -> DENIED
4. Member of `famA` attempting to write to `/families/famB/inventory` -> DENIED
5. Malicious user attempting to set invalid familyId with SQL/script injection -> DENIED
6. Spoofed email claiming admin privileges without verification -> DENIED
7. User attempting to delete another member's feeding entry without permission -> DENIED
8. Attempting to write unvalidated fields or oversized payloads -> DENIED
9. Modifying another user's profile document `/users/{otherId}` -> DENIED
10. Attempting to list root documents without membership -> DENIED
11. Bypassing stock threshold validation with negative inventory -> Prevented
12. Creating a family with an ID exceeding 128 characters or containing illegal symbols -> DENIED
