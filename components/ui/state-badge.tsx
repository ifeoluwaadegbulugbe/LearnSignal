// Back-compat shim: the status system lives in ./status.tsx.
import { STATUS, StatusPill } from './status';
import { ConfidenceSignal } from './signal';

export const STATE_UI = STATUS;
export const StateBadge = StatusPill;
export const ConfidenceBadge = ConfidenceSignal;
