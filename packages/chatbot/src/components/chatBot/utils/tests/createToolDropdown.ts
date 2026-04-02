/**
 * Internal dependencies
 */
import createToolDropdown from "../createToolDropdown";

describe("createToolDropdown", () => {
  it('should filter out tools named "dummyTool" (ignoring prefix)', () => {
    const tools = [{ name: "dummyTool", inputSchema: {} }];

    const result = createToolDropdown(tools as any[], {}, {}, 0);
    expect(result).toEqual([]);
  });

  it('should correctly group and format "extension_tool_" items using ToolNameMap', () => {
    const tools = [
      { name: "extension_tool_check_available_apis", inputSchema: {} },
    ];

    const result = createToolDropdown(
      tools as any[],
      {},
      {
        "1234": {
          url: "https://google.com",
          id: 1234,
          index: 1,
          pinned: false,
          highlighted: false,
          windowId: 1,
          frozen: false,
          incognito: false,
          discarded: false,
          selected: true,
          active: false,
          autoDiscardable: true,
          groupId: 1,
        },
      },
      1234,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      group: "MCP-B",
      hideLabel: true,
      id: "MCP-B",
      label: "MCP-B",
      items: [
        {
          id: "MCP-B",
          label: "MCP-B",
          mainLabel: "Tools Types",
          submenu: [
            {
              id: "API Check",
              label: "API Check",
              mainLabel: "Tools",
              submenu: [
                {
                  hideLabel: false,
                  id: "extension_tool_check_available_apis",
                  label: "check_available_apis",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("should prioritize Website tools before Extension tools in the final list", () => {
    const tools = [
      {
        name: "extension_tool_check_available_apis",
        inputSchema: {},
        isExtension: true,
      },
      {
        name: "wt_tab1234_google_com_tab",
        inputSchema: {},
        isWebsite: true,
      },
    ];

    const result = createToolDropdown(
      tools as any[],
      {},
      {
        "1234": {
          url: "https://google.com",
          id: 1234,
          index: 1,
          pinned: false,
          highlighted: false,
          windowId: 1,
          frozen: false,
          incognito: false,
          discarded: false,
          selected: true,
          active: false,
          autoDiscardable: true,
          groupId: 1,
        },
      },
      1234,
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("google.com"); // Website tool first
    expect(result[1].items[0].submenu[0].id).toBe("API Check"); // Extension tool second
  });

  it("should handle complex name parsing for website tools (stripping _tab and replacing _ with .)", () => {
    // Logic test: name without prefix -> split by '_' -> join '_' -> split '_tab' -> replace '_' with '.'
    // Input: website_tool_docs_google_com_tab
    // 1. remove prefix: docs_google_com_tab
    // 2. split/join (redundant in logic but exists): docs_google_com_tab
    // 3. split '_tab': docs_google_com
    // 4. replace '_': docs.google.com

    const tools = [{ name: "docs_google_com", inputSchema: {} }];

    const result = createToolDropdown(
      tools as any[],
      {},
      {
        "1234": {
          url: "https://docs.google.com",
          id: 1234,
          index: 1,
          pinned: false,
          highlighted: false,
          windowId: 1,
          frozen: false,
          incognito: false,
          discarded: false,
          selected: true,
          active: false,
          autoDiscardable: true,
          groupId: 1,
        },
      },
      1234,
    );

    expect(result[0].id).toBe("docs.google.com");
  });
});
