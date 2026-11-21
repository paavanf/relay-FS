// webhookOff.test.js
// With no SUPABASE_WEBHOOK_SECRET the Supabase Auth webhook does not exist:
// it answers 404 like any unknown path - an empty secret lets nobody in.

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { useEmptyDb } from '../helpers/apiTest.js';

const world = useEmptyDb();

describe('the Supabase Auth webhook, not configured', () => {
  it('answers 404, whatever is sent', async () => {
    for (const authorization of ['', 'Bearer ', 'Bearer anything']) {
      const res = await request(world.app)
        .post('/api/v1/webhooks/supabase-auth')
        .set('Authorization', authorization)
        .send({ type: 'DELETE', record: null, old_record: { id: 'x' } });
      expect(res.status).toBe(404);
    }
  });
});
