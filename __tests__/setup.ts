// Global test setup — runs before each test file
import { vi } from 'vitest'

// Suppress console.error in tests (we assert on it explicitly when needed)
vi.spyOn(console, 'error').mockImplementation(() => {})
