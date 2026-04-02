import assert from 'node:assert/strict';
import { resetDiagnosticsForTests } from '../src/lib/runtime-diagnostics';
import {
  reconcileCardScopedProgression,
  resetProgressionReconcileStateForTests,
  shouldRunProgressionReconcile,
} from '../src/utils/progression-reconcile';
import { resetProgressionSyncStateForTests } from '../src/utils/progression-sync';

async function run(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

function resetTestState(): void {
  resetDiagnosticsForTests();
  resetProgressionSyncStateForTests();
  resetProgressionReconcileStateForTests();
}

(async () => {
  await run('reconcile gate enforces online/visibility/write-in-progress constraints', () => {
    assert.deepEqual(
      shouldRunProgressionReconcile({ online: false, visible: true, writeInFlight: false }),
      { allow: false, reason: 'offline' },
    );

    assert.deepEqual(
      shouldRunProgressionReconcile({ online: true, visible: false, writeInFlight: false }),
      { allow: false, reason: 'hidden' },
    );

    assert.deepEqual(
      shouldRunProgressionReconcile({ online: true, visible: true, writeInFlight: true }),
      { allow: false, reason: 'write_in_progress' },
    );

    assert.deepEqual(
      shouldRunProgressionReconcile({ online: true, visible: true, writeInFlight: false }),
      { allow: true, reason: 'ready' },
    );
  });

  await run('reconcile safely skips when card session is missing or demo-only', async () => {
    resetTestState();

    const missing = await reconcileCardScopedProgression(null, 'tests.reconcile.missing');
    assert.equal(missing.status, 'skipped');
    assert.equal(missing.reason, 'invalid_card_session');

    const demo = await reconcileCardScopedProgression('DEMO-DEV', 'tests.reconcile.demo');
    assert.equal(demo.status, 'skipped');
    assert.equal(demo.reason, 'invalid_card_session');
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
})();
