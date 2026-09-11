const { test } = require("node:test");
const assert = require("node:assert/strict");

function loadClient(nodeEnv, secret) {
  const previousEnv = process.env.NODE_ENV;
  const previousSecret = process.env.CHATBOT_INTERNAL_SECRET;
  const modulePath = require.resolve("../src/configs/chatbot");
  process.env.NODE_ENV = nodeEnv;
  if (secret === undefined) delete process.env.CHATBOT_INTERNAL_SECRET;
  else process.env.CHATBOT_INTERNAL_SECRET = secret;
  delete require.cache[modulePath];
  try {
    return require(modulePath);
  } finally {
    delete require.cache[modulePath];
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousSecret === undefined) delete process.env.CHATBOT_INTERNAL_SECRET;
    else process.env.CHATBOT_INTERNAL_SECRET = previousSecret;
  }
}

test("chatbot production rejects missing, blank or short secret", () => {
  for (const secret of [undefined, "", " ".repeat(32), "short", "x".repeat(31)]) {
    assert.throws(() => loadClient("production", secret), /CHATBOT_INTERNAL_SECRET/);
  }
});

test("chatbot forwards valid production secret without surrounding whitespace", () => {
  const secret = "test-only-chatbot-internal-secret-32";
  const client = loadClient("production", `  ${secret}  `);
  assert.equal(client.defaults.headers.common["X-Internal-Secret"], secret);
});

test("chatbot development still supports a local service without secret", () => {
  assert.equal(loadClient("development", undefined).defaults.headers.common["X-Internal-Secret"], undefined);
});
