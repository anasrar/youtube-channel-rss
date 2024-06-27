<script lang="ts">
  import { Toaster } from "$lib/components/ui/sonner";
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import * as Dialog from "$lib/components/ui/dialog";
  import { createMatchMedia } from "$lib/hooks/matchmedia";

  type ApiHandleStruct = {
    kind: string;
    etag: string;
    items: {
      kind: string;
      etag: string;
      id: string | null;
    }[]
  }

  const REGEX_AT = new RegExp(/^@/);
  const REGEX_SLASH_AT = new RegExp(/^\/@/);
  const REGEX_SLASH_CHANNEL_ID = new RegExp(/^\/channel\//);
  const ALLOWD_PATTERNS = [
    "@HANDLE",
    "https://youtube.com/@HANDLE",
    "https://m.youtube.com/@HANDLE",
    "https://youtube.com/channel/ID",
    "https://m.youtube.com/channel/ID",
  ]

  let loading = false;
  let modalResult = false;
  let result = "";

  const isMobile = createMatchMedia("(max-width: 640px)");

  const getIdFromHandle = async (handle: string): Promise<[null, Error] | [string | null, null]> => {
    loading = true;
    try {
      const r = await fetch(`https://yt.lemnoslife.com/channels?handle=${handle}`, { signal: AbortSignal.timeout(20000) })
      const j = (await r.json()) as ApiHandleStruct;
      loading = false;
      return [j.items[0].id, null];
    } catch (err) {
      loading = false;
      return [null, err as Error];
    }
  }

  const getRssAddressFromChannleId = (channelId: string) => {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  }

  const onSubmit = async (event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement; }) => {
    event.preventDefault();
    const { currentTarget } = event;
    const form = new FormData(currentTarget);
    const input = form.get("input")!.toString();

    if (REGEX_AT.test(input)) {
      const [channelId, err] = await getIdFromHandle(input);
      if (err) {
        toast.error("Error", { description: err.message });
        return;
      }

      if (channelId) {
        result = getRssAddressFromChannleId(channelId);
        modalResult = true;
      } else {
        toast.error("Error", { description: "Channel id not found" });
      }
      return;
    }

    try {
      const { pathname } = new URL(input);
      if (REGEX_SLASH_AT.test(pathname)) {
        const [channelId, err] = await getIdFromHandle(pathname.replace("/", ""));
        if (err) {
          toast.error("Error", { description: err.message });
          return;
        }

        if (channelId) {
          result = getRssAddressFromChannleId(channelId);
          modalResult = true;
        } else {
          toast.error("Error", { description: "Channel id not found" });
        }
        return;
      }

      if (REGEX_SLASH_CHANNEL_ID.test(pathname)) {
        result = getRssAddressFromChannleId(pathname.replace("/channel/", ""));
        modalResult = true;
        return;
      }
    } catch {}

    toast.error("Error", { description: "Pattern not allowed" });
  }

  const onCopy = () => {
    try {
      navigator.clipboard.writeText(result);
      toast.success("Success", { description: "Success to copy RSS address" });
    } catch {
      toast.error("Error", { description: "Failed to copy" });
    }
  }
</script>

<Toaster position="top-center" />
<main class="flex flex-col justify-center items-center min-h-dvh">
  <div class="flex flex-col gap-6 w-80">
    <form on:submit={onSubmit} class="flex flex-row items-center gap-4">
      <Input class="w-full" placeholder="https://youtube.com/@handle" name="input" required disabled={loading} />
      <Button type="submit" disabled={loading}>
        {#if loading}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        {/if}
        Get RSS
      </Button>
    </form>
    <div class="flex flex-col gap-3">
      <div class="scroll-m-20 text-md font-semibold tracking-tight">
        API
      </div>
      <div>	
        <code
          class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        >
          yt.lemnoslife.com
        </code>
      </div>
    </div>
    <div class="flex flex-col gap-3">
      <div class="scroll-m-20 text-md font-semibold tracking-tight">
        Allowed Patterns
      </div>
        <ol class="flex flex-col gap-2 ml-6 list-decimal">
          {#each ALLOWD_PATTERNS as pattern }
            <li>	
              <code
                class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
              >
                {pattern}
              </code>
            </li>
          {/each}
        </ol>
    </div>
  </div>
</main>
{#if $isMobile}
  <Drawer.Root bind:open={modalResult}>
    <Drawer.Content>
      <div class="mx-auto w-full max-w-sm">
        <Drawer.Header>
          <Drawer.Title>RSS Address</Drawer.Title>
          <Drawer.Description>YouTube Channel RSS Address.</Drawer.Description>
        </Drawer.Header>
        <div class="p-4 pb-0">
          <Input bind:value={result} readonly />
        </div>
        <Drawer.Footer>
          <Button on:click={onCopy}>Copy</Button>
          <Drawer.Close asChild let:builder>
            <Button builders={[builder]} variant="outline">Close</Button>
          </Drawer.Close>
        </Drawer.Footer>
      </div>
    </Drawer.Content>
  </Drawer.Root>
  {:else}
  <Dialog.Root bind:open={modalResult}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header class="flex flex-col space-y-3">
        <Dialog.Title>RSS Address</Dialog.Title>
        <Dialog.Description>YouTube Channel RSS Address.</Dialog.Description>
      </Dialog.Header>
      <div>
        <Input bind:value={result} readonly />
      </div>
      <Dialog.Footer>
        <Button on:click={onCopy}>Copy</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
