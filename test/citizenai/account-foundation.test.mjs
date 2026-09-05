import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import {
  MemoryAccountOwnershipRepository,
  createSupabaseAuthVerifier
} from '../../src/citizenai/account-access.mjs';
import { guestAccessTokenForLearner, verifyGuestAccessToken } from '../../src/citizenai/runtime-access.mjs';
import { createRuntimeHttpHandler } from '../../src/citizenai/runtime-http.mjs';
import { MemoryRuntimeRepository } from '../../src/citizenai/runtime-repository.mjs';
import { createRuntimeService } from '../../src/citizenai/runtime-service.mjs';

const GUEST_SECRET = 'citizenai-account-test-guest-secret-0123456789';
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

async function jsonRequest(baseUrl, path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; }
  catch { payload = text; }
  return { response, payload };
}

test('Supabase access verifier validates users through Auth without service-role credentials', async () => {
  const calls = [];
  const verifier = createSupabaseAuthVerifier({
    supabaseUrl: 'https://project.supabase.co/',
    publishableKey: 'sb_publishable_test',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ id: USER_A, email: 'learner@example.com' }) };
    }
  });

  assert.equal(verifier.configured, true);
  assert.deepEqual(await verifier('account-token-a'), { id: USER_A, email: 'learner@example.com' });
  assert.equal(calls[0].url, 'https://project.supabase.co/auth/v1/user');
  assert.equal(calls[0].init.headers.apikey, 'sb_publishable_test');
  assert.equal(calls[0].init.headers.authorization, 'Bearer account-token-a');
  assert.equal(await verifier('citizenai_guest_not-an-account-token'), null);
});

test('claiming preserves the learner and disables the old guest token', async () => {
  const repository = new MemoryRuntimeRepository();
  const ownership = new MemoryAccountOwnershipRepository();
  const service = createRuntimeService({ repository });
  const authenticateAccount = async (token) => token === 'account-token-a'
    ? { id: USER_A, email: 'a@example.com' }
    : token === 'account-token-b'
      ? { id: USER_B, email: 'b@example.com' }
      : null;
  const authorizeGuestLearner = async (learnerId, token) => verifyGuestAccessToken({ learnerId, token, secret: GUEST_SECRET });
  const authorizeLearner = async (learnerId, token) => {
    const owner = await ownership.findByLearnerId(learnerId);
    if (!owner) return authorizeGuestLearner(learnerId, token);
    return (await authenticateAccount(token))?.id === owner.authUserId;
  };
  const findLearnerForAccount = async (authUserId) => {
    const owner = await ownership.findByAuthUserId(authUserId);
    return owner ? repository.getLearner(owner.learnerId) : null;
  };
  const claimLearnerForAccount = async (learnerId, authUserId) => {
    const learner = await repository.getLearner(learnerId);
    if (!learner) return { ok: false, reason: 'learner_not_found' };
    const learnerOwner = await ownership.findByLearnerId(learnerId);
    if (learnerOwner && learnerOwner.authUserId !== authUserId) return { ok: false, reason: 'learner_already_claimed' };
    const accountOwner = await ownership.findByAuthUserId(authUserId);
    if (accountOwner && accountOwner.learnerId !== learnerId) return { ok: false, reason: 'account_already_has_learner' };
    const claimed = await ownership.claim(learnerId, authUserId);
    return claimed ? { ok: true, learner } : { ok: false, reason: 'claim_conflict' };
  };

  const handler = createRuntimeHttpHandler({
    service,
    issueLearnerAccessToken: (learnerId) => guestAccessTokenForLearner(learnerId, GUEST_SECRET),
    authorizeLearner,
    authorizeGuestLearner,
    authenticateAccount,
    findLearnerForAccount,
    claimLearnerForAccount,
    resolveMockLearnerId: async (mockId) => (await repository.getMock(mockId))?.learnerId ?? null
  });
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const created = await jsonRequest(baseUrl, '/v1/learners', { method: 'POST', body: { examDate: '2026-10-01' } });
    assert.equal(created.response.status, 201);
    const learnerId = created.payload.id;
    const guestToken = created.payload.accessToken;

    const beforeClaim = await jsonRequest(baseUrl, '/v1/dashboard', {
      headers: { 'x-citizenai-learner-id': learnerId, authorization: `Bearer ${guestToken}` }
    });
    assert.equal(beforeClaim.response.status, 200);

    const claim = await jsonRequest(baseUrl, '/v1/account/claim', {
      method: 'POST',
      headers: { authorization: 'Bearer account-token-a', 'x-citizenai-guest-token': guestToken },
      body: { learnerId }
    });
    assert.equal(claim.response.status, 200);
    assert.equal(claim.payload.claimed, true);
    assert.equal(claim.payload.learner.id, learnerId, 'claim must preserve the exact learner row');

    const staleGuest = await jsonRequest(baseUrl, '/v1/dashboard', {
      headers: { 'x-citizenai-learner-id': learnerId, authorization: `Bearer ${guestToken}` }
    });
    assert.equal(staleGuest.response.status, 401, 'guest token must stop working after account claim');

    const ownerAccess = await jsonRequest(baseUrl, '/v1/dashboard', {
      headers: { 'x-citizenai-learner-id': learnerId, authorization: 'Bearer account-token-a' }
    });
    assert.equal(ownerAccess.response.status, 200);

    const crossUser = await jsonRequest(baseUrl, '/v1/dashboard', {
      headers: { 'x-citizenai-learner-id': learnerId, authorization: 'Bearer account-token-b' }
    });
    assert.equal(crossUser.response.status, 401, 'another authenticated user must not access the learner');

    const restored = await jsonRequest(baseUrl, '/v1/account/learner', {
      headers: { authorization: 'Bearer account-token-a' }
    });
    assert.equal(restored.response.status, 200);
    assert.equal(restored.payload.learner.id, learnerId);

    const second = await jsonRequest(baseUrl, '/v1/learners', { method: 'POST', body: {} });
    const secondClaim = await jsonRequest(baseUrl, '/v1/account/claim', {
      method: 'POST',
      headers: { authorization: 'Bearer account-token-a', 'x-citizenai-guest-token': second.payload.accessToken },
      body: { learnerId: second.payload.id }
    });
    assert.equal(secondClaim.response.status, 409, 'one account cannot silently replace an existing learner');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
