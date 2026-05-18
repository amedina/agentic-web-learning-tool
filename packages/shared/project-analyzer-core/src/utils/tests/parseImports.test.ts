/**
 * External dependencies.
 */
import { describe, it, expect } from "vitest";

/**
 * Internal dependencies.
 */
import { parseImports } from "../parseImports";

describe("parseImports", () => {
  it("extracts a default import", () => {
    const result = parseImports(`import Chip from "./chip";`);

    expect(result).toEqual([
      {
        source: "./chip",
        symbols: ["default"],
        isTypeOnly: false,
        isSideEffectOnly: false,
      },
    ]);
  });

  it("extracts named imports and drops aliases", () => {
    const result = parseImports(
      `import { ChipsFilter, foo as bar } from "./types";`,
    );

    expect(result).toHaveLength(1);
    expect(result[0].symbols).toEqual(["ChipsFilter", "foo"]);
    expect(result[0].isTypeOnly).toBe(false);
  });

  it("flags the entire statement as type-only when `import type` is used", () => {
    const result = parseImports(`import type { ChipsFilter } from "./types";`);

    expect(result[0].isTypeOnly).toBe(true);
    expect(result[0].symbols).toEqual(["ChipsFilter"]);
  });

  it("flags as type-only when every named specifier is `type X`", () => {
    const result = parseImports(`import { type A, type B } from "./types";`);

    expect(result[0].isTypeOnly).toBe(true);
    expect(result[0].symbols).toEqual(["A", "B"]);
  });

  it("does NOT flag as type-only when only some specifiers are `type X`", () => {
    const result = parseImports(`import { type A, B } from "./types";`);

    expect(result[0].isTypeOnly).toBe(false);
  });

  it("handles namespace imports", () => {
    const result = parseImports(`import * as Utils from "./utils";`);

    expect(result[0].symbols).toEqual(["* as Utils"]);
  });

  it("handles a mixed default + named clause", () => {
    const result = parseImports(
      `import Chip, { ChipsFilter, type Variant } from "./mixed";`,
    );

    expect(result[0].symbols).toEqual(["default", "ChipsFilter", "Variant"]);
    expect(result[0].isTypeOnly).toBe(false);
  });

  it("captures side-effect-only imports", () => {
    const result = parseImports(`import "./register-polyfill";`);

    expect(result[0]).toMatchObject({
      source: "./register-polyfill",
      symbols: [],
      isSideEffectOnly: true,
    });
  });

  it("captures re-exports from another file", () => {
    const result = parseImports(`export { ChipsFilter } from "./types";`);

    expect(result).toEqual([
      {
        source: "./types",
        symbols: ["ChipsFilter"],
        isTypeOnly: false,
        isSideEffectOnly: false,
      },
    ]);
  });

  it("captures `export * from`", () => {
    const result = parseImports(`export * from "./barrel";`);

    expect(result[0].source).toBe("./barrel");
    expect(result[0].symbols).toEqual(["*"]);
  });

  it("ignores `import` keywords that live inside comments", () => {
    const source = `
      // import Comment from "ignore-me";
      /* import { Nope } from "also-ignore"; */
      import Real from "./real";
    `;
    const result = parseImports(source);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("./real");
  });

  it("handles multi-line imports", () => {
    const source = `import {
      a,
      b,
      c as renamed,
    } from "./long";`;

    const result = parseImports(source);
    expect(result[0].source).toBe("./long");
    expect(result[0].symbols).toEqual(["a", "b", "c"]);
  });
});
