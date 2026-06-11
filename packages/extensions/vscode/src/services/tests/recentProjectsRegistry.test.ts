/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  recordAllProjectsClosed,
  recordProjectClosed,
  recordProjectOpened,
  type RecentProjectEntry,
} from "../recentProjectsRegistry";

function makeEntry(overrides: Partial<RecentProjectEntry>): RecentProjectEntry {
  return {
    absolutePath: "/Users/me/projects/foo",
    name: "foo",
    lastOpenedAt: "2026-01-01T00:00:00.000Z",
    isCurrentlyOpen: false,
    ...overrides,
  };
}

describe("recordProjectOpened", () => {
  it("appends a new entry when the path isn't already tracked", () => {
    const before: RecentProjectEntry[] = [];
    const after = recordProjectOpened(before, {
      absolutePath: "/Users/me/projects/foo",
      name: "foo",
    });
    expect(after).toHaveLength(1);
    expect(after[0].absolutePath).toBe("/Users/me/projects/foo");
    expect(after[0].name).toBe("foo");
    expect(after[0].isCurrentlyOpen).toBe(true);
  });

  it("updates the existing entry in place when the path is already tracked", () => {
    const before: RecentProjectEntry[] = [
      makeEntry({
        absolutePath: "/Users/me/projects/foo",
        name: "foo",
        isCurrentlyOpen: false,
      }),
    ];
    const after = recordProjectOpened(before, {
      absolutePath: "/Users/me/projects/foo",
      name: "foo-renamed",
    });
    expect(after).toHaveLength(1);
    expect(after[0].name).toBe("foo-renamed");
    expect(after[0].isCurrentlyOpen).toBe(true);
  });

  it("preserves entries for other projects", () => {
    const before: RecentProjectEntry[] = [
      makeEntry({ absolutePath: "/a", name: "a", isCurrentlyOpen: false }),
      makeEntry({ absolutePath: "/b", name: "b", isCurrentlyOpen: false }),
    ];
    const after = recordProjectOpened(before, {
      absolutePath: "/a",
      name: "a",
    });
    expect(after.map((entry) => entry.absolutePath)).toEqual(["/a", "/b"]);
  });
});

describe("recordProjectClosed", () => {
  it("flips the isCurrentlyOpen flag of the matching entry", () => {
    const before: RecentProjectEntry[] = [
      makeEntry({ absolutePath: "/a", isCurrentlyOpen: true }),
      makeEntry({ absolutePath: "/b", isCurrentlyOpen: true }),
    ];
    const after = recordProjectClosed(before, "/a");
    expect(after[0].isCurrentlyOpen).toBe(false);
    expect(after[1].isCurrentlyOpen).toBe(true);
  });

  it("does not delete the entry, so the project stays in the recent list", () => {
    const before: RecentProjectEntry[] = [
      makeEntry({ absolutePath: "/a", isCurrentlyOpen: true }),
    ];
    const after = recordProjectClosed(before, "/a");
    expect(after).toHaveLength(1);
    expect(after[0].absolutePath).toBe("/a");
  });

  it("returns the registry unchanged when the path isn't tracked", () => {
    const before: RecentProjectEntry[] = [
      makeEntry({ absolutePath: "/a", isCurrentlyOpen: true }),
    ];
    const after = recordProjectClosed(before, "/missing");
    expect(after).toEqual(before);
  });
});

describe("recordAllProjectsClosed", () => {
  it("flips every entry's isCurrentlyOpen to false", () => {
    const before: RecentProjectEntry[] = [
      makeEntry({ absolutePath: "/a", isCurrentlyOpen: true }),
      makeEntry({ absolutePath: "/b", isCurrentlyOpen: true }),
      makeEntry({ absolutePath: "/c", isCurrentlyOpen: false }),
    ];
    const after = recordAllProjectsClosed(before);
    expect(after.every((entry) => !entry.isCurrentlyOpen)).toBe(true);
    expect(after).toHaveLength(3);
  });
});
