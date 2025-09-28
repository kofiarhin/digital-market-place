const { configureInMemoryModels, resetStores } = require("../utils/inMemoryModels");

jest.setTimeout(60000);

jest.mock("stripe", () => {
  const sessionsCreateMock = jest.fn();
  const constructEventMock = jest.fn();

  const Stripe = jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: sessionsCreateMock
      }
    },
    webhooks: {
      constructEvent: constructEventMock
    }
  }));

  Stripe.__mocks = {
    sessionsCreateMock,
    constructEventMock
  };

  Stripe.resetMock = () => {
    Stripe.mockClear();
    sessionsCreateMock.mockReset();
    constructEventMock.mockReset();
  };

  return Stripe;
});

let inMemoryDatabase;

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
  process.env.DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || "test-download-secret";
  process.env.CLIENT_URL = process.env.CLIENT_URL || "http://client.example";
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_key";
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_key";

  inMemoryDatabase = configureInMemoryModels();
});

afterEach(() => {
  if (inMemoryDatabase && typeof inMemoryDatabase.reset === "function") {
    inMemoryDatabase.reset();
  } else {
    resetStores();
  }

  const Stripe = require("stripe");
  if (Stripe.resetMock) {
    Stripe.resetMock();
  }
});

afterAll(() => {
  if (inMemoryDatabase && typeof inMemoryDatabase.reset === "function") {
    inMemoryDatabase.reset();
  } else {
    resetStores();
  }
});
