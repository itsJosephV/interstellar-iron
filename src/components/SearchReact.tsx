import React from "react";
import { Autocomplete } from "@base-ui/react";

interface SearchResult {
  url: string;
  meta: { title: string };
  filters: { category: string };
}

const SearchReact = () => {
  const [searchValue, setSearchValue] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const pagefindRef = React.useRef<any>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  function getStatus(): React.ReactNode | null {
    if (isPending) {
      return (
        <React.Fragment>
          <div
            className="size-4 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin"
            aria-hidden
          />
          Searching…
        </React.Fragment>
      );
    }

    if (error) {
      return error;
    }

    if (searchValue === "") {
      return null;
    }

    if (searchResults.length === 0) {
      return `No results found for "${searchValue}"`;
    }

    return `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} found`;
  }

  const status = getStatus();

  React.useEffect(() => {
    async function initPagefind() {
      try {
        const pagefind = await import(
          /* @vite-ignore */ "/dist" + "/pagefind/pagefind.js"
        );
        await pagefind.init();
        pagefindRef.current = pagefind;
      } catch (e) {
        console.error("Failed to initialize pagefind:", e);
      }
    }
    initPagefind();
  }, []);

  return (
    <Autocomplete.Root
      items={searchResults}
      value={searchValue}
      onValueChange={(nextSearchValue) => {
        setSearchValue(nextSearchValue);

        const controller = new AbortController();
        abortControllerRef.current?.abort();
        abortControllerRef.current = controller;

        if (nextSearchValue === "") {
          setSearchResults([]);
          setError(null);
          return;
        }

        startTransition(async () => {
          setError(null);
          if (!pagefindRef.current) {
            setSearchResults([]);
            setError("Search is not ready");
            return;
          }
          const result = await pagefindRef.current.search(nextSearchValue);
          if (controller.signal.aborted) {
            return;
          }

          if (!result || !result.results) {
            setSearchResults([]);
            setError("No results found");
            return;
          }

          const data = await Promise.all(
            result.results.map((r: any) => r.data()),
          );
          startTransition(() => {
            setSearchResults(data);
            setError(null);
          });
        });
      }}
      itemToStringValue={(item: SearchResult) => item.meta.title}
      filter={null}
    >
      <label className="flex flex-col gap-1 text-sm leading-5 font-medium text-gray-900">
        Search posts
        <Autocomplete.Input
          placeholder="e.g. Edificio Dársena"
          className="bg-[canvas] h-10 w-[16rem] md:w-[20rem] font-normal rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </label>

      <Autocomplete.Portal hidden={!status}>
        <Autocomplete.Positioner
          className="outline-none"
          sideOffset={4}
          align="start"
        >
          <Autocomplete.Popup
            className="w-(--anchor-width) max-h-[min(var(--available-height),23rem)] max-w-(--available-width) overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-gray-900 shadow-lg shadow-gray-200 outline-1 outline-gray-200 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300"
            aria-busy={isPending || undefined}
          >
            <Autocomplete.Status>
              {status && (
                <div className="flex items-center gap-2 py-1 pl-4 pr-8 text-sm text-gray-600">
                  {status}
                </div>
              )}
            </Autocomplete.Status>
            <Autocomplete.List>
              {(post: SearchResult) => (
                <Autocomplete.Item
                  key={post.url}
                  className="flex cursor-default py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:text-gray-50 data-highlighted:before:absolute data-highlighted:before:inset-x-2 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:rounded data-highlighted:before:bg-gray-900"
                  value={post}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="font-medium leading-5">
                      {post.meta.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {post.filters.category}
                    </div>
                  </div>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
};

export default SearchReact;
