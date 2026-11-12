import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { agent, auth, closeTestDb, connectTestDb, registerUser, resetTestDb } from "./helpers.js";

async function boardFixture(token) {
  const organization = await agent().post("/api/organizations").set(auth(token)).send({ name: "Ops" });
  const board = await agent()
    .post(`/api/organizations/${organization.body.organization._id}/boards`)
    .set(auth(token))
    .send({ name: "Sprint" });
  const view = await agent().get(`/api/boards/${board.body.board._id}`).set(auth(token));
  return {
    organization: organization.body.organization,
    board: board.body.board,
    lists: view.body.lists,
  };
}

describe("AT-04 AT-05 AT-08 cards", { concurrency: 1 }, () => {
  before(connectTestDb);
  beforeEach(resetTestDb);
  after(closeTestDb);

  test("AT-04 moves a card to another list and keeps the order", async () => {
    const user = await registerUser("Kai", "kai@example.com");
    const { board, lists } = await boardFixture(user.token);
    const [listA, listB] = lists;
    const created = await agent()
      .post(`/api/lists/${listA._id}/cards`)
      .set(auth(user.token))
      .send({ title: "Ship API" });
    assert.equal(created.status, 201);

    const moved = await agent()
      .post(`/api/cards/${created.body.card._id}/move`)
      .set(auth(user.token))
      .send({ listId: listB._id, index: 0 });
    assert.equal(moved.status, 200);

    const view = await agent().get(`/api/boards/${board._id}`).set(auth(user.token));
    const card = view.body.cards.find((item) => item._id === created.body.card._id);
    assert.equal(card.listId, listB._id);
    const ordered = view.body.cards
      .filter((item) => item.listId === listB._id)
      .map((item) => item._id);
    assert.deepEqual(ordered, [created.body.card._id]);
  });

  test("AT-05 rejects a move onto a list from another board", async () => {
    const user = await registerUser("Noor", "noor@example.com");
    const first = await boardFixture(user.token);
    const second = await boardFixture(user.token);
    const created = await agent()
      .post(`/api/lists/${first.lists[0]._id}/cards`)
      .set(auth(user.token))
      .send({ title: "Stay put" });

    const rejected = await agent()
      .post(`/api/cards/${created.body.card._id}/move`)
      .set(auth(user.token))
      .send({ listId: second.lists[0]._id, index: 0 });
    assert.equal(rejected.status, 400);

    const view = await agent().get(`/api/boards/${first.board._id}`).set(auth(user.token));
    const card = view.body.cards.find((item) => item.title === "Stay put");
    assert.equal(card.listId, first.lists[0]._id);
  });

  test("AT-08 keeps every card after concurrent order updates", async () => {
    const user = await registerUser("Omar", "omar@example.com");
    const { board, lists } = await boardFixture(user.token);
    const list = lists[0];
    const titles = ["One", "Two", "Three"];
    const cards = [];
    for (const title of titles) {
      const response = await agent().post(`/api/lists/${list._id}/cards`).set(auth(user.token)).send({ title });
      cards.push(response.body.card);
    }

    const results = await Promise.all([
      agent().post(`/api/cards/${cards[0]._id}/move`).set(auth(user.token)).send({ listId: list._id, index: 2 }),
      agent().post(`/api/cards/${cards[2]._id}/move`).set(auth(user.token)).send({ listId: lists[1]._id, index: 0 }),
    ]);
    assert.ok(results.every((result) => result.status === 200));

    const view = await agent().get(`/api/boards/${board._id}`).set(auth(user.token));
    const ids = view.body.cards.map((card) => card._id);
    assert.equal(new Set(ids).size, 3);
    assert.equal(ids.length, 3);
    for (const card of view.body.cards) {
      assert.ok(lists.some((item) => item._id === card.listId));
    }
  });
});
