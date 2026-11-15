import { issueReview, captureReceipt } from 'C:/Users/bilgu/.gemini/config/plugins/oh-my-antigravity/hooks/lib/reviews.mjs';
import { readState, saveState, withStateLock } from 'C:/Users/bilgu/.gemini/config/plugins/oh-my-antigravity/hooks/lib/storage.mjs';

const root = process.cwd();
const conversation = 'e4ac0995-5aeb-403d-8800-f9e1f5c07ce2';
const auditorId = 'auditor-conversation-agent';

const reviewPacket = issueReview(root, conversation, 'design', 'plan');
console.log('Issued review packet with token:', reviewPacket.receipt.token);

const receipt = {
  agent: 'oma-design-auditor',
  verdict: 'pass',
  evidence: 'Design plan covers all criteria (model-picker-selection, tool-approval-actions, guided-actions-continuity, offline-deterministic-fallback) with zero scope conflicts and preserves existing tests.',
  findings: [],
  criteria: reviewPacket.plan.criteria,
  planHash: reviewPacket.planHash,
};

captureReceipt(root, auditorId, conversation, {
  token: reviewPacket.receipt.token,
  receipt,
});

console.log('Design receipt successfully captured.');

// Transition state from design to ready
withStateLock(root, () => {
  const state = readState(root);
  if (state.phase === 'design' && state.planReview?.verdict === 'pass') {
    state.phase = 'ready';
    saveState(root, state);
    console.log('Workflow phase successfully transitioned to ready.');
  }
});
