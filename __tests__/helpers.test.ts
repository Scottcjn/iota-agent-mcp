// SPDX-License-Identifier: MIT
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { gql, rpc, text, wallet } from "../src/index";

function response({
  ok = true,
  status = 200,
  statusText = "OK",
  json,
  bodyText,
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: unknown;
  bodyText?: string;
}) {
  return {
    ok,
    status,
    statusText,
    json: async () => json,
    text: async () => bodyText ?? "",
  } as unknown as Response;
}

describe("helper functions", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("text wraps strings in an MCP text content response", () => {
    expect(text("hello")).toEqual({
      content: [{ type: "text", text: "hello" }],
    });
  });

  test("rpc posts a JSON-RPC envelope and returns formatted result JSON", async () => {
    const fetchMock = jest.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      response({
        json: { result: { objectId: "0xabc", version: "7" } },
      })
    );
    globalThis.fetch = fetchMock;

    await expect(rpc("iota_getObject", ["0xabc"])).resolves.toBe(
      JSON.stringify({ objectId: "0xabc", version: "7" }, null, 2)
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mainnet.iota.cafe",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "iota_getObject",
          params: ["0xabc"],
        }),
      })
    );
  });

  test("rpc reports HTTP failures without trying to parse JSON", async () => {
    const fetchMock = jest.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      response({ ok: false, status: 429, statusText: "Too Many Requests" })
    );
    globalThis.fetch = fetchMock;

    await expect(rpc("iota_getLatestCheckpointSequenceNumber")).resolves.toBe(
      "HTTP 429: Too Many Requests"
    );
  });

  test("gql posts the supplied query and returns formatted data", async () => {
    const fetchMock = jest.fn<typeof fetch>();
    fetchMock.mockResolvedValue(
      response({ json: { data: { epoch: { epochId: "42" } } } })
    );
    globalThis.fetch = fetchMock;

    await expect(gql("{ epoch { epochId } }")).resolves.toBe(
      JSON.stringify({ epoch: { epochId: "42" } }, null, 2)
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://graphql.mainnet.iota.cafe",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ query: "{ epoch { epochId } }" }),
      })
    );
  });

  test("wallet sends JSON body for POST requests and returns server text", async () => {
    const fetchMock = jest.fn<typeof fetch>();
    fetchMock.mockResolvedValue(response({ bodyText: "{\"ok\":true}" }));
    globalThis.fetch = fetchMock;

    await expect(
      wallet("/switch-network", "POST", { network: "testnet" })
    ).resolves.toBe("{\"ok\":true}");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3847/switch-network",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: "testnet" }),
      }
    );
  });

  test("wallet explains unreachable local wallet server errors", async () => {
    const fetchMock = jest.fn<typeof fetch>();
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    globalThis.fetch = fetchMock;

    await expect(wallet("/balance")).resolves.toContain(
      "Wallet server unreachable (http://localhost:3847): ECONNREFUSED"
    );
  });
});
