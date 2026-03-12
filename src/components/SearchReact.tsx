import React from "react";
import { Autocomplete } from "@base-ui/react";

interface SearchResult {
  url: string;
  meta: { title: string };
  filters: { category: string };
  excerpt: string;
}

const SearchReact = () => {
  const [searchValue, setSearchValue] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const pagefindRef = React.useRef<any>(null);
  const isWarm = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    async function initPagefind() {
      try {
        const pagefindPath = import.meta.env.DEV
          ? "/dist/pagefind/pagefind.js"
          : "/pagefind/pagefind.js";

        const pagefind = await import(/* @vite-ignore */ pagefindPath);
        await pagefind.init();
        pagefindRef.current = pagefind;
      } catch (e) {
        console.error("Failed to initialize pagefind:", e);
      }
    }
    initPagefind();
  }, []);

  function getStatus(): React.ReactNode | null {
    if (isPending && !isWarm.current) {
      return (
        <React.Fragment>
          <div
            className="size-4 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin"
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

  return (
    <Autocomplete.Root
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
            isWarm.current = true;
          });
        });
      }}
      itemToStringValue={(item: SearchResult) => item.meta.title}
      filter={null}
    >
      <label className="flex flex-col gap-1 text-sm leading-5 font-medium text-slate-900">
        Search posts
        <Autocomplete.Input
          placeholder="e.g. Edificio Dársena"
          className="bg-[canvas] h-10 w-sm md:w-lg font-normal rounded-md border border-slate-200 pl-3.5 text-base text-slate-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
      </label>

      <Autocomplete.Portal hidden={!status}>
        <Autocomplete.Positioner
          className="outline-none"
          sideOffset={4}
          align="start"
        >
          <Autocomplete.Popup
            className="w-(--anchor-width) max-h-[min(var(--available-height),23rem)] max-w-(--available-width) overflow-y-auto scroll-pt-2 scroll-pb-2 overscroll-contain rounded-md bg-[canvas] py-2 text-slate-700 shadow-md shadow-slate-200 outline-1 outline-slate-200"
            aria-busy={isPending || undefined}
          >
            <Autocomplete.Status>
              {status && (
                <div className="flex items-center gap-2 py-1 pl-4 pr-8 text-sm text-slate-600">
                  {status}
                </div>
              )}
            </Autocomplete.Status>
            <Autocomplete.List>
              {searchResults.map((post) => (
                <Autocomplete.Item
                  key={post.meta.title}
                  className="flex py-2 pr-8 pl-4 text-base leading-4 outline-none select-none data-highlighted:relative data-highlighted:z-0 data-highlighted:before:absolute data-highlighted:before:inset-x-2 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:rounded data-highlighted:before:bg-slate-100 cursor-pointer"
                  value={post}
                  render={<a href={post.url.replace(/^\/dist/, "")} />}
                >
                  <div className="flex w-full flex-col gap-1 ">
                    <div className="font-medium leading-5">
                      {post.meta.title}
                    </div>
                    <div className="text-sm text-slate-400">
                      {post.filters.category}
                    </div>
                    {post.excerpt && (
                      <div
                        className="text-sm text-slate-500 line-clamp-2 [&_mark]:bg-transparent [&_mark]:text-slate-900 [&_mark]:font-medium"
                        dangerouslySetInnerHTML={{ __html: post.excerpt }}
                      />
                    )}
                  </div>
                </Autocomplete.Item>
              ))}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
};

export default SearchReact;
