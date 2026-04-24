import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.print
vi.stubGlobal('print', vi.fn());
