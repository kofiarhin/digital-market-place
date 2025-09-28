const request = require("../tests/utils/testApp");

describe("GET /health", () => {
  it("returns ok", async () => {
    const response = await request.get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
