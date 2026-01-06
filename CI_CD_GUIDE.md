# CI/CD Pipeline Documentation - Backend

## Overview

This project uses GitHub Actions for Continuous Integration and Continuous Deployment. The CI/CD pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

## Pipeline Jobs

| Job | Description |
|-----|-------------|
| **lint** | Runs ESLint to check code quality |
| **unit-tests** | Runs Jest unit tests |
| **e2e-tests** | Runs E2E booking tests with PostgreSQL |
| **build** | Verifies the project builds successfully |

## E2E Test Coverage

### Backend Tests (`test/booking.e2e-spec.ts`)

1. **Single Service Booking**
   - Get available time slots
   - Create booking with specific technician (Isabella for Manicure)
   - Verify booking was created
   - Verify slot blocking (no double booking)

2. **Multi-Service Consecutive Booking**
   - Get multi-service slots (permutation algorithm)
   - Verify slot with permutations endpoint
   - Create consecutive bookings (Manicure then Pedicure)

3. **VIP Combo Simultaneous Booking**
   - Get VIP combo slots (2 technicians same time)
   - Verify technician preferences (e.g., Sofia for Pedicure)
   - Create simultaneous bookings with different technicians

4. **Combo Package Booking**
   - Get combo/package services
   - Handle gel services combo

5. **Permutation Logic**
   - Test when technician is busy at start but free later
   - Verify algorithm finds valid slot ordering

## Running Tests Locally

```bash
# Unit tests
npm test

# E2E tests (requires PostgreSQL)
npm run test:e2e

# E2E tests for booking only
npm run test:e2e -- --testPathPattern=booking
```

## Environment Variables for E2E Tests

```env
NODE_ENV=test
DATABASE_URL=postgres://user:pass@localhost:5432/db_test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=testuser
DB_PASSWORD=testpass
DB_DATABASE=nails_and_beauty_test
JWT_SECRET=test-secret
JWT_REFRESH_SECRET=test-refresh-secret
```

## Test Data IDs (from seed data)

### Services
| Service | ID | Duration |
|---------|-----|----------|
| Basic Manicure | `a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b501` | 30 min (+15 buffer) |
| Basic Spa Pedicure | `c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d701` | 45 min (+15 buffer) |
| Gel Basic Manicure | `a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b502` | 45 min (+15 buffer) |
| Gel Basic Pedicure | `c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d702` | 60 min (+15 buffer) |

### Staff
| Name | ID | Services |
|------|-----|----------|
| Isabella | `20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b301` | Manicure |
| Camila | `20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b302` | Both |
| Sofia | `20b1c2d3-e4f5-47a6-b7c8-d9e0f1a2b303` | Pedicure |

## Deployment

Render automatically deploys when code is pushed to `main`. The CI pipeline runs first, and deployment happens via Render's GitHub integration.

### Optional: Trigger Deploy via GitHub Actions

Uncomment the `deploy` job in `.github/workflows/ci.yml` and add secret:
- `RENDER_DEPLOY_HOOK`: Deploy hook URL from Render dashboard
