const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.ACCESS_TOKEN_SECRET = "chatbot-auth-test-only-signing-secret";
process.env.CHATBOT_INTERNAL_SECRET = "chatbot-auth-test-only-internal-secret";
const chatbotClient = require("../src/configs/chatbot");
const router = require("../src/routes/chatbot.routes");

test("chatbot rejects guests and invalid tokens before calling the AI service", async (t) => {
  const downstream = t.mock.method(chatbotClient, "post", async () => ({
    data: { answer: "Test answer", suggestions: [] },
  }));
  const app = express();
  app.use(express.json());
  app.use("/api/chatbot", router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/chatbot`;
  const request = (token, body = { message: "Hello" }) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const user = { id: "user-1", role: "user" };
  const expired = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -1 });
  const wrongSignature = jwt.sign(user, "wrong-test-secret");

  for (const token of [undefined, "invalid-token", expired, wrongSignature]) {
    const response = await request(token);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).success, false);
  }
  assert.equal((await request(undefined, {})).status, 401);
  assert.equal(downstream.mock.callCount(), 0);

  for (const role of ["user", "tutor"]) {
    const token = jwt.sign({ ...user, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });
    const response = await request(token);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.answer, "Test answer");
    const [path, payload, config] = downstream.mock.calls.at(-1).arguments;
    assert.equal(path, "/api/chat");
    assert.deepEqual(payload.user, { ...user, role });
    assert.equal(payload.message, "Hello");
    assert.equal(config.headers.Authorization, `Bearer ${token}`);
  }
  assert.equal(downstream.mock.callCount(), 2);
});
