import assert from 'node:assert/strict';
import {
  clearProgressionUxIssue,
  getProgressionUxIssue,
  reportProgressionUxIssue,
  resetProgressionUxStateForTests,
  subscribeToProgressionUxIssue,
} from '../src/utils/progression-ux-state';

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

run('progression UX issue reports and clears by card', () => {
  resetProgressionUxStateForTests();

  reportProgressionUxIssue({
    cardId: 'PS-1001',
    code: 'STALE_BASE_VERSION_CONFLICT',
    message: 'stale base version',
    recoverable: true,
    artifact: 'collection',
  });

  const issue = getProgressionUxIssue('PS-1001');
  assert.ok(issue);
  assert.equal(issue?.code, 'STALE_BASE_VERSION_CONFLICT');
  assert.equal(issue?.artifact, 'collection');

  clearProgressionUxIssue('PS-1001');
  assert.equal(getProgressionUxIssue('PS-1001'), null);
});

run('progression UX issue subscriptions notify on update', () => {
  resetProgressionUxStateForTests();

  let notifications = 0;
  const unsub = subscribeToProgressionUxIssue(() => {
    notifications += 1;
  });

  reportProgressionUxIssue({
    cardId: 'PS-1002',
    code: 'LOCAL_DIRTY_DEFERRED',
    message: 'deferred pending local state',
    recoverable: true,
  });
  clearProgressionUxIssue('PS-1002');

  unsub();

  assert.equal(notifications, 2);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
