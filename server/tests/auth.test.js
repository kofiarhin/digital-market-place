const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("./utils/testApp");
const User = require("../models/User");

const createUser = async (overrides = {}) => {
  const password = overrides.password || "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  return User.create({
    name: overrides.name || "Jane Doe",
    email: overrides.email || `user${new mongoose.Types.ObjectId()}@example.com`,
    password: hashedPassword,
    role: overrides.role || "buyer"
  });
};

describe("Auth routes", () => {
  describe("POST /api/auth/register", () => {
    it("registers a user", async () => {
      const response = await request.post("/api/auth/register").send({
        name: "Alice",
        email: "alice@example.com",
        password: "securepass",
        role: "seller"
      });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toMatchObject({
        name: "Alice",
        email: "alice@example.com",
        role: "seller"
      });
    });

    it("returns 400 when fields missing", async () => {
      const response = await request.post("/api/auth/register").send({ email: "missing@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Missing required fields");
    });

    it("returns 409 when email exists", async () => {
      await createUser({ email: "dup@example.com" });

      const response = await request.post("/api/auth/register").send({
        name: "Dup",
        email: "dup@example.com",
        password: "secret"
      });

      expect(response.status).toBe(409);
    });

    it("handles server errors", async () => {
      const spy = jest.spyOn(User, "create").mockRejectedValue(new Error("db down"));

      const response = await request.post("/api/auth/register").send({
        name: "Bob",
        email: "bob@example.com",
        password: "secret"
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to register");

      spy.mockRestore();
    });

    it("fails when JWT secret missing", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const response = await request.post("/api/auth/register").send({
        name: "No Secret",
        email: "nosecret@example.com",
        password: "secret"
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to register");

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with correct credentials", async () => {
      await createUser({ email: "login@example.com", password: "password123" });

      const response = await request.post("/api/auth/login").send({
        email: "login@example.com",
        password: "password123"
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user.email).toBe("login@example.com");
    });

    it("returns 400 when credentials missing", async () => {
      const response = await request.post("/api/auth/login").send({ email: "login@example.com" });

      expect(response.status).toBe(400);
    });

    it("returns 401 for invalid email", async () => {
      const response = await request.post("/api/auth/login").send({
        email: "notfound@example.com",
        password: "whatever"
      });

      expect(response.status).toBe(401);
    });

    it("returns 401 for invalid password", async () => {
      await createUser({ email: "badpass@example.com", password: "password123" });

      const response = await request.post("/api/auth/login").send({
        email: "badpass@example.com",
        password: "wrong"
      });

      expect(response.status).toBe(401);
    });

    it("handles login server errors", async () => {
      const spy = jest.spyOn(User, "findOne").mockRejectedValue(new Error("db down"));

      const response = await request.post("/api/auth/login").send({
        email: "login@example.com",
        password: "password123"
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to login");

      spy.mockRestore();
    });
  });

  describe("GET /api/auth/me", () => {
    it("requires authentication", async () => {
      const response = await request.get("/api/auth/me");

      expect(response.status).toBe(401);
    });

    it("returns current user", async () => {
      const user = await createUser({ email: "me@example.com" });
      const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

      const response = await request.get("/api/auth/me").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("me@example.com");
    });

    it("returns 404 when user missing", async () => {
      const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role: "buyer" }, process.env.JWT_SECRET, {
        expiresIn: "1h"
      });

      const response = await request.get("/api/auth/me").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("handles profile errors", async () => {
      const user = await createUser({ email: "error@example.com" });
      const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const spy = jest.spyOn(User, "findById").mockRejectedValue(new Error("db down"));

      const response = await request.get("/api/auth/me").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to load profile");

      spy.mockRestore();
    });

    it("fails when JWT secret missing in auth middleware", async () => {
      const user = await createUser({ email: "secretless@example.com" });
      const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const response = await request.get("/api/auth/me").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid authentication token");

      process.env.JWT_SECRET = originalSecret;
    });
  });
});
