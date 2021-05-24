import { ref, watch } from 'https://cdn.jsdelivr.net/npm/vue@3.0.11/dist/vue.esm-browser.js'

function useTitle(t) {
  const title = ref(t || document.title)

  watch(
    title,
    (newTitle) => {
      if (newTitle != null) {
        document.title = newTitle
      }
    },
    { immediate: true }
  )

  return title
}

export { useTitle }
