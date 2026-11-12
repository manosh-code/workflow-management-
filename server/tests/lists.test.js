import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { agent, auth, closeTestDb, connectTestDb, registerUser, resetTestDb } from "./helpers.js";

describe("AT-03 lists", { concurrency: 1 }, () => {
  before(connectTestDb);
  beforeEach(resetTestDb);
  after(closeTestDb);

  test("persists board list order", async () => {
    const user = await registerUser("Nia", "nia@example.com");
    const organization = await agent()
      .post("/api/organizations")
      .set(auth(user.token))
      .send({ name: "Studio" });
    const created = await agent()
      .post(`/api/organizations/${organization.body.organization._id}/boards`)
      .set(auth(user.token))
      .send({ name: "Product" });
    const boardId = created.body.board._id;

    const first = await agent().get(`/api/boards/${boardId}`).set(auth(user.token));
    assert.equal(first.status, 200);
    assert.deepEqual(
      first.body.lists.map((list) => list.name),
      ["To Do", "In Progress", "Done"],
    );

    const extra = await agent()
      .post(`/api/boards/${boardId}/lists`)
      .set(auth(user.token))
      .send({ name: "Review" });
    assert.equal(extra.status, 201);

    const reversedIds = [...first.body.lists.map((list) => list._id), extra.body.list._id].reverse();
    const reordered = await agent()
      .post(`/api/boards/${boardId}/lists/reorder`)
      .set(auth(user.token))
      .send({ listIds: reversedIds });
    assert.equal(reordered.status, 200);

    const again = await agent().get(`/api/boards/${boardId}`).set(auth(user.token));
    assert.deepEqual(
      again.body.lists.map((list) => list._id),
      reversedIds,
    );
  });
});
