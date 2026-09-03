<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BarSeries from '../components/BarSeries.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import { fetchStats } from '../composables/api'
import { t, useI18n } from '../i18n'
import type { Stats } from '../types'

const { locale } = useI18n()

const stats = ref<Stats | null>(null)
const failed = ref(false)

onMounted(async () => {
  try {
    stats.value = await fetchStats()
  } catch {
    failed.value = true // transparency is a nicety – fail quietly
  }
})

/** "YYYY-MM-DD" -> localized short numeric date (e.g. de "4.9.", ar "٤/٩"). */
function shortDate(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  try {
    return new Intl.DateTimeFormat(locale.value, {
      day: 'numeric',
      month: 'numeric',
    }).format(new Date(year!, (month ?? 1) - 1, date))
  } catch {
    return `${date}.${month}.`
  }
}

const usage = computed(() => stats.value?.usage14d ?? [])
const labels = computed(() => usage.value.map((entry) => shortDate(entry.day)))
const listViews = computed(() => usage.value.map((entry) => entry.listViews))
const reports = computed(() => usage.value.map((entry) => entry.reports))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="disp page-title">{{ t('statistik.title') }}</h1>
      <p class="page-sub">
        {{ t('statistik.intro') }}
        <RouterLink to="/datenschutz" class="privacylink">
          {{ t('statistik.privacyLink') }}
        </RouterLink>
      </p>
    </header>

    <p v-if="failed" class="hint" data-test="stats-unavailable">
      {{ t('statistik.unavailable') }}
    </p>

    <template v-else-if="stats">
      <!-- number tiles -->
      <div class="tiles" data-test="tiles">
        <div class="card tile">
          <span class="tilevalue">{{ stats.reports7d }}</span>
          <span class="tilelabel">{{ t('statistik.reports7d') }}</span>
        </div>
        <div class="card tile">
          <span class="tilevalue">{{ stats.pushSubscriptions }}</span>
          <span class="tilelabel">{{ t('statistik.pushSubs') }}</span>
        </div>
        <div class="card tile">
          <span class="tilevalue"><bdi dir="ltr">{{ stats.withFood }}&hairsp;/&hairsp;{{ stats.fairteilerTotal }}</bdi></span>
          <span class="tilelabel">{{ t('statistik.withFood') }}</span>
        </div>
      </div>

      <!-- charts -->
      <section class="card block" :aria-label="t('statistik.viewsChart')" data-test="views-chart">
        <span class="disp blocktitle">{{ t('statistik.viewsChart') }}</span>
        <div class="chartwrap">
          <BarSeries :values="listViews" :labels="labels" />
        </div>
      </section>

      <section class="card block" :aria-label="t('statistik.reportsChart')" data-test="reports-chart">
        <span class="disp blocktitle">{{ t('statistik.reportsChart') }}</span>
        <div class="chartwrap">
          <BarSeries :values="reports" :labels="labels" />
        </div>
      </section>

      <p class="footer">{{ t('statistik.footer') }}</p>
    </template>

    <template v-else>
      <div class="tiles" data-test="skeletons">
        <div v-for="n in 3" :key="n" class="card tile">
          <SkeletonBlock width="42px" height="20px" :announce="n === 1" />
          <SkeletonBlock width="80%" height="11px" />
        </div>
      </div>
      <div v-for="n in 2" :key="`c${n}`" class="card block sk-chart">
        <SkeletonBlock width="45%" height="16px" />
        <SkeletonBlock width="100%" height="90px" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.privacylink {
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.tiles {
  display: flex;
  gap: 10px;
  margin: 16px 16px 0 16px;
}

.tile {
  flex: 1;
  min-width: 0;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  text-align: center;
}

.tilevalue {
  font-size: 18px;
  font-weight: 650;
  font-family: 'Bricolage Grotesque', 'Avenir Next', system-ui, sans-serif;
}

.tilelabel {
  font-size: 11px;
  color: var(--muted);
}

.block {
  margin: 12px 16px 0 16px;
  padding: 16px;
}

.blocktitle {
  font-weight: 650;
  font-size: 15px;
}

.chartwrap {
  margin-top: 12px;
  overflow-x: auto;
}

.sk-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer {
  font-size: 12px;
  color: var(--faint);
  text-align: center;
  padding: 14px 20px 0 20px;
  margin: 0;
}
</style>
