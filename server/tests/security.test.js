import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { agent, auth, closeTestDb, connectTestDb, registerUser, resetTestDb } from "./helpers.js";

describe("AT-07 output safety", { concurrency: 1 }, () => {
  before(connectTestDb);
  beforeEach(resetTestDb);
  after(closeTestDb);

  test("stores markup as text and responds with JSON", async () => {
    const user = await registerUser("Rae", "rae@example.com");
    const organization = await agent().post("/api/organizations").set(auth(user.token)).send({ name: "Safe" });
    const board = await agent()
      .post(`/api/organizations/${organization.body.organization._id}/boards`)
      .set(auth(user.token))
      .send({ name: "Board" });
    const view = await agent().get(`/api/boards/${board.body.board._id}`).set(auth(user.token));
    const payload = '<img src=x onerror="alert(1)"><script>alert(1)</script>';

    const created = await agent()
      .post(`/api/lists/${view.body.lists[0]._id}/cards`)
      .set(auth(user.token))
      .send({ title: payload });
    assert.equal(created.status, 201);
    assert.match(created.headers["content-type"], /application\/json/);
    assert.equal(created.body.card.title, payload);

    const comment = await agent()
      .post(`/api/cards/${created.body.card._id}/comments`)
      .set(auth(user.token))
      .send({ body: payload });
    assert.equal(comment.status, 201);
    assert.match(comment.headers["content-type"], /application\/json/);
    assert.equal(comment.body.comment.body, payload);
    assert.equal(String(comment.text).includes("<html"), false);
  });
});
