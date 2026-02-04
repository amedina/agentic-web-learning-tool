/**
 * External dependencies
 */
import { useState, useMemo, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Button, Input } from "@google-awlt/design-system";

type ListPaneProps<T> = {
  items: T[];
  listItems: () => void;
  clearItems: () => void;
  setSelectedItem: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  title: string;
  buttonText: string;
  isButtonDisabled?: boolean;
};

const ListPane = <T extends object>({
  items,
  listItems,
  clearItems,
  setSelectedItem,
  renderItem,
  title,
  buttonText,
  isButtonDisabled,
}: ListPaneProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    return items.filter((item) => {
      const searchableText = [
        (item as { name?: string }).name || "",
        (item as { description?: string }).description || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery]);

  const handleSearchClick = useCallback(() => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearchBlur = useCallback(() => {
    if (!searchQuery.trim()) {
      setIsSearchExpanded(false);
    }
  }, [searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  return (
    <div className="bg-card border border-border rounded-lg shadow flex-1">
      <div className="p-4 border-b border-gray-200 dark:border-border">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold dark:text-white flex-shrink-0">
            {title}
          </h3>
          <div className="flex items-center justify-end min-w-0 flex-1">
            {!isSearchExpanded ? (
              <button
                name="search"
                aria-label="Search"
                onClick={handleSearchClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-secondary rounded-md transition-all duration-300 ease-in-out"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
            ) : (
              <div className="flex items-center w-full max-w-xs">
                <Input
                  ref={searchInputRef}
                  name="search"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onBlur={handleSearchBlur}
                  className="pl-10 w-full transition-all duration-300 ease-in-out"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={listItems}
          disabled={isButtonDisabled}
        >
          {buttonText}
        </Button>
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={clearItems}
          disabled={items.length === 0}
        >
          Clear
        </Button>
        <div className="space-y-2 overflow-y-auto max-h-96">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center py-2 px-4 rounded hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 cursor-pointer"
              onClick={() => setSelectedItem(item)}
              role="button"
              onKeyDown={() => {}}
              tabIndex={0}
            >
              {renderItem(item)}
            </div>
          ))}
          {filteredItems.length === 0 && searchQuery && items.length > 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No items found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListPane;
