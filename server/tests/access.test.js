import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { agent, auth, closeTestDb, connectTestDb, registerUser, resetTestDb } from "./helpers.js";

async function createOrgBoard(token, orgName = "Acme") {
  const organization = await agent()
    .post("/api/organizations")
    .set(auth(token))
    .send({ name: orgName });
  const board = await agent()
    .post(`/api/organizations/${organization.body.organization._id}/boards`)
    .set(auth(token))
    .send({ name: "Launch", description: "Private board" });
  return { organization: organization.body.organization, board: board.body.board };
}

describe("AT-02 and AT-06 access control", { concurrency: 1 }, () => {
  before(connectTestDb);
  beforeEach(resetTestDb);
  after(closeTestDb);

  test("AT-02 denies a board outside the caller organization", async () => {
    const owner = await registerUser("Owner", "owner@example.com");
    const outsider = await registerUser("Outsider", "outsider@example.com");
    const { board } = await createOrgBoard(owner.token);

    const response = await agent().get(`/api/boards/${board._id}`).set(auth(outsider.token));
    assert.equal(response.status, 404);
    assert.equal(JSON.stringify(response.body).includes("Launch"), false);
    assert.equal(JSON.stringify(response.body).includes("Private board"), false);
  });

  test("AT-06 denies a removed member who reuses a still-signed token", async () => {
    const admin = await registerUser("Admin", "admin@example.com");
    const member = await registerUser("Member", "member@example.com");
    const { organization, board } = await createOrgBoard(admin.token);

    const added = await agent()
      .post(`/api/organizations/${organization._id}/members`)
      .set(auth(admin.token))
      .send({ email: "member@example.com", role: "member" });
    assert.equal(added.status, 201);

    const allowed = await agent().get(`/api/boards/${board._id}`).set(auth(member.token));
    assert.equal(allowed.status, 200);

    const removed = await agent()
      .delete(`/api/organizations/${organization._id}/members/${member.user._id}`)
      .set(auth(admin.token));
    assert.equal(removed.status, 200);

    const denied = await agent().get(`/api/boards/${board._id}`).set(auth(member.token));
    assert.equal(denied.status, 404);
    assert.equal(JSON.stringify(denied.body).includes("Launch"), false);
  });

  test("keeps the last organization administrator", async () => {
    const admin = await registerUser("Admin", "solo@example.com");
    const { organization } = await createOrgBoard(admin.token);
    const response = await agent()
      .delete(`/api/organizations/${organization._id}/members/${admin.user._id}`)
      .set(auth(admin.token));
    assert.equal(response.status, 409);
  });
});
