import request from "supertest";
import { app } from "../src/app.js";
import { connectDb, disconnectDb } from "../src/config/db.js";
import { Activity } from "../src/models/Activity.js";
import { Board } from "../src/models/Board.js";
import { Card } from "../src/models/Card.js";
import { Comment } from "../src/models/Comment.js";
import { Label } from "../src/models/Label.js";
import { List } from "../src/models/List.js";
import { Membership } from "../src/models/Membership.js";
import { Organization } from "../src/models/Organization.js";
import { User } from "../src/models/User.js";

export async function connectTestDb() {
  await connectDb();
}

export async function resetTestDb() {
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Membership.deleteMany({}),
    Board.deleteMany({}),
    List.deleteMany({}),
    Card.deleteMany({}),
    Label.deleteMany({}),
    Comment.deleteMany({}),
    Activity.deleteMany({}),
  ]);
}

export async function closeTestDb() {
  await disconnectDb();
}

export function agent() {
  return request(app);
}

export async function registerUser(name, email, password = "password123") {
  const response = await agent().post("/api/auth/register").send({ name, email, password });
  if (response.status !== 201) {
    throw new Error(`register failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}
