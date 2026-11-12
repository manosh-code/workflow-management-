import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { agent, auth, closeTestDb, connectTestDb, registerUser, resetTestDb } from "./helpers.js";

describe("AT-01 authentication", { concurrency: 1 }, () => {
  before(connectTestDb);
  beforeEach(resetTestDb);
  after(closeTestDb);

  test("rejects a second registration with the same email", async () => {
    await registerUser("Ada", "ada@example.com");
    const duplicate = await agent().post("/api/auth/register").send({
      name: "Ada Two",
      email: "ada@example.com",
      password: "password123",
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.message, "Email is already registered");
    assert.equal(duplicate.body.stack, undefined);
    assert.equal(duplicate.body.passwordHash, undefined);
  });

  test("signs in with valid credentials and rejects a privileged role on registration", async () => {
    const created = await registerUser("Grace", "grace@example.com");
    assert.ok(created.token);
    assert.equal(created.user.passwordHash, undefined);

    const escalated = await agent().post("/api/auth/register").send({
      name: "Eve",
      email: "eve@example.com",
      password: "password123",
      role: "admin",
    });
    assert.equal(escalated.status, 400);

    const signedIn = await agent().post("/api/auth/login").send({
      email: "grace@example.com",
      password: "password123",
    });
    assert.equal(signedIn.status, 200);

    const me = await agent().get("/api/users/me").set(auth(created.token));
    assert.equal(me.status, 200);

    await agent().post("/api/auth/logout").set(auth(created.token));
    const afterLogout = await agent().get("/api/users/me").set(auth(created.token));
    assert.equal(afterLogout.status, 401);
  });
});
