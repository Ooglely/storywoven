import { mount, unmount } from "svelte";
import Dialog from "$lib/elements/Dialog.svelte";

export async function openDialog(key: string) {
  try {
    // import dialog content based on key
    const content = await import(`./content/${key}.svelte`);
    const instance = mount(Dialog, {
      target: document.body,
      props: {
        children: content.default,
        onclose: () => {
          unmount(instance);
        },
      },
    });
  } catch (e) {
    console.error(`Failed to load dialog: ${e}`);
  }
}
