// Back-compat shim: the status system now lives in ./status.tsx.
import { STATUS, StatusPill, ConfidenceDots } from './status';

export const STATE_UI = STATUS;
export const StateBadge = StatusPill;
export const ConfidenceBadge = ConfidenceDots;
