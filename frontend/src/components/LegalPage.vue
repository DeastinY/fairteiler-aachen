<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ title: string }>()

const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/mehr')
}
</script>

<template>
  <div class="page">
    <div class="head">
      <button type="button" class="roundbtn backbtn" aria-label="Zurück" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22301f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6"></path>
        </svg>
      </button>
      <h1 class="disp title">{{ title }}</h1>
      <span class="spacer" aria-hidden="true"></span>
    </div>
    <article class="legal">
      <slot />
    </article>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0 20px;
}

.backbtn {
  background: var(--surface);
  border: 1px solid var(--border);
}

.title {
  font-weight: 750;
  font-size: 22px;
  letter-spacing: -0.02em;
  margin: 0;
}

.spacer {
  width: 44px;
}

.legal {
  padding: 8px 20px 24px 20px;
}

.legal :slotted(h2) {
  font-family: 'Bricolage Grotesque', 'Avenir Next', system-ui, sans-serif;
  font-weight: 650;
  font-size: 17px;
  margin: 22px 0 6px 0;
}

.legal :slotted(p) {
  font-size: 14px;
  line-height: 1.6;
  margin: 10px 0 0 0;
  color: var(--ink);
}

.legal :slotted(address) {
  font-style: normal;
  font-size: 14px;
  line-height: 1.6;
  margin: 10px 0 0 0;
}

.legal :slotted(mark.ph) {
  background: var(--amber-soft);
  color: var(--amber-ink);
  border-radius: 4px;
  padding: 1px 5px;
  font-weight: 600;
}
</style>
