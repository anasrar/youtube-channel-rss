import { onMount } from "svelte";
import { writable } from "svelte/store";

export function createMatchMedia(query: string) {
  const mql = window.matchMedia(query);
  const value = writable(mql.matches);

  onMount(() => {
    const change = (event: MediaQueryListEvent) => {
      value.set(event.matches);
    };

    mql.addEventListener("change", change);

    return () => {
      mql.removeEventListener("change", change);
    };
  });

  return value;
}
