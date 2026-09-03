<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t, type MessageKey } from '../i18n'
import {
  ApiError,
  deleteReport,
  fetchFairteilerList,
  submitReport,
} from '../composables/api'
import { forgetOwnReport, rememberOwnReport } from '../composables/ownReports'
import { showToast } from '../composables/useToast'
import { FOOD_TAGS, tagLabel } from '../lib/labels'
import type { FairteilerListItem, ReportType } from '../types'

const route = useRoute()
const router = useRouter()

const fairteiler = ref<FairteilerListItem[] | null>(null)
const loadError = ref<string | null>(null)

const selectedId = ref<number | null>(null)
const selectedType = ref<ReportType>('brought')
const selectedTags = ref<string[]>([])

const submitting = ref(false)
const submitError = ref<string | null>(null)

const ACTIONS: { type: ReportType; titleKey: MessageKey; noteKey?: MessageKey }[] = [
  { type: 'brought', titleKey: 'melden.brought', noteKey: 'melden.broughtNote' },
  { type: 'taken', titleKey: 'melden.taken' },
  { type: 'empty', titleKey: 'melden.empty' },
]

/** Condition reports – never change the food status, tracked separately. */
const CONDITIONS: { type: ReportType; titleKey: MessageKey }[] = [
  { type: 'cleaned', titleKey: 'melden.cleaned' },
  { type: 'needs_cleaning', titleKey: 'melden.needsCleaning' },
  { type: 'needs_maintenance', titleKey: 'melden.defect' },
]

const selected = computed(() =>
  fairteiler.value?.find((f) => f.id === selectedId.value) ?? null,
)

async function load() {
  loadError.value = null
  try {
    const list = await fetchFairteilerList()
    fairteiler.value = list
    const fromQuery = Number(route.query.fairteiler)
    const preselected = list.find((f) => f.id === fromQuery)
    selectedId.value = preselected?.id ?? list[0]?.id ?? null
  } catch {
    loadError.value = t('common.loadError')
  }
}

onMounted(load)

function chooseType(type: ReportType) {
  selectedType.value = type
  submitError.value = null
}

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value = [...selectedTags.value, tag]
  }
}

async function undoReport(reportId: number) {
  try {
    await deleteReport(reportId)
    forgetOwnReport(reportId)
    showToast(t('detail.undone'))
  } catch (e) {
    showToast(
      e instanceof ApiError
        ? e.message
        : t('detail.undoFailed'),
    )
  }
}

async function submit() {
  if (submitting.value || selectedId.value === null) return
  submitting.value = true
  submitError.value = null
  try {
    const fairteilerId = selectedId.value
    const created = await submitReport(fairteilerId, {
      type: selectedType.value,
      tags: selectedType.value === 'brought' ? selectedTags.value : [],
    })
    rememberOwnReport({
      id: created.id,
      fairteilerId,
      createdAt: created.createdAt,
    })
    showToast(t('melden.success'), {
      green: true,
      duration: 6000,
      action: { label: t('melden.undoAction'), handler: () => void undoReport(created.id) },
    })
    router.push(`/fairteiler/${fairteilerId}`)
  } catch (e) {
    if (e instanceof ApiError) {
      submitError.value = e.message
    } else {
      submitError.value = t('melden.networkError')
    }
  } finally {
    submitting.value = false
  }
}

function close() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div class="page">
    <!-- header -->
    <div class="head">
      <div class="headrow">
        <button type="button" class="roundbtn closebtn" :aria-label="t('common.close')" @click="close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22301f" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12 M18 6L6 18"></path>
          </svg>
        </button>
        <h1 class="disp headtitle">{{ t('melden.title') }}</h1>
        <span class="headspacer" aria-hidden="true"></span>
      </div>

      <p v-if="!fairteiler && !loadError" class="hint">{{ t('common.loading') }}</p>
      <div v-else-if="loadError" class="hint error">
        <p>{{ loadError }}</p>
        <button type="button" class="retrybtn" @click="load">{{ t('common.retry') }}</button>
      </div>

      <label v-else class="placecard">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21s-7-5.1-7-11a7 7 0 0 1 14 0c0 5.9-7 11-7 11z"></path>
          <circle cx="12" cy="10" r="2.5"></circle>
        </svg>
        <span class="placebody">
          <span class="placelabel">{{ t('melden.fairteilerLabel') }}</span>
          <select v-model.number="selectedId" class="placeselect" :aria-label="t('melden.selectAria')">
            <option v-for="f in fairteiler" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </select>
          <span v-if="selected" class="placestreet">{{ selected.street }} · {{ selected.city }}</span>
        </span>
      </label>
    </div>

    <template v-if="fairteiler && !loadError">
      <!-- action choice (food actions + condition reports = one radio group) -->
      <div class="section" role="radiogroup" :aria-label="t('melden.what')">
        <div class="disp sectiontitle">{{ t('melden.what') }}</div>
        <div class="actionlist">
          <button
            v-for="action in ACTIONS"
            :key="action.type"
            type="button"
            class="actioncard"
            :class="{ sel: selectedType === action.type }"
            role="radio"
            :aria-checked="selectedType === action.type"
            @click="chooseType(action.type)"
          >
            <span class="actionicon" :class="action.type">
              <svg v-if="action.type === 'brought'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fdfcf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5 M5 12l7-7 7 7"></path>
              </svg>
              <svg v-else-if="action.type === 'taken'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#566b5c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 5v14 M5 12l7 7 7-7"></path>
              </svg>
              <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#565f59" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M8 12h8"></path>
              </svg>
            </span>
            <span class="actionbody">
              <span class="actiontitle">{{ t(action.titleKey) }}</span>
              <span v-if="action.noteKey" class="actionnote">{{ t(action.noteKey) }}</span>
            </span>
            <svg class="check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 13l4 4 10-10"></path>
            </svg>
          </button>
        </div>

        <!-- condition reports -->
        <div class="disp subsectiontitle">{{ t('melden.condition') }}</div>
        <div class="actionlist">
          <button
            v-for="condition in CONDITIONS"
            :key="condition.type"
            type="button"
            class="actioncard conditioncard"
            :class="{ sel: selectedType === condition.type }"
            role="radio"
            :aria-checked="selectedType === condition.type"
            @click="chooseType(condition.type)"
          >
            <span class="conditionicon">
              <svg v-if="condition.type === 'cleaned'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#266645" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M8.5 12.5l2.5 2.5 5-5.5"></path>
              </svg>
              <svg v-else-if="condition.type === 'needs_cleaning'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a6516" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3 C12 3 6 10.5 6 14.5 a6 6 0 0 0 12 0 C18 10.5 12 3 12 3 Z"></path>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a4432f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14.5 6.5a4 4 0 0 1 5-5l-3 3 1 2 2 1 3-3a4 4 0 0 1-5 5L8 19.5a2 2 0 0 1-3-3z"></path>
              </svg>
            </span>
            <span class="conditiontitle">{{ t(condition.titleKey) }}</span>
            <svg class="check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7d54" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 13l4 4 10-10"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- tags (only meaningful when something was brought) -->
      <div v-if="selectedType === 'brought'" class="section">
        <div class="tagshead">
          <span class="disp sectiontitle notitlegap">{{ t('melden.tagsTitle') }}</span>
          <span class="tagsnote">{{ t('melden.tagsNote') }}</span>
        </div>
        <div class="tags">
          <button
            v-for="tag in FOOD_TAGS"
            :key="tag"
            type="button"
            class="foodchip"
            :aria-pressed="selectedTags.includes(tag)"
            @click="toggleTag(tag)"
          >
            {{ tagLabel(tag) }}
          </button>
        </div>
      </div>

      <div class="section">
        <RouterLink to="/regeln" class="regelnlink" data-test="regeln-link">
          {{ t('melden.rulesLink') }}
        </RouterLink>
      </div>

      <!-- submit -->
      <div class="submitblock">
        <p v-if="submitError" class="submiterror" role="alert">{{ submitError }}</p>
        <button
          type="button"
          class="sendbtn"
          :disabled="submitting || selectedId === null"
          @click="submit"
        >
          {{ submitting ? t('melden.submitting') : t('melden.submit') }}
        </button>
        <p class="finenote">{{ t('melden.footer') }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.head {
  padding: 20px 20px 0 20px;
}

.headrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.closebtn {
  background: var(--surface);
  border: 1px solid var(--border);
}

.headtitle {
  font-weight: 700;
  font-size: 18px;
  margin: 0;
}

.headspacer {
  width: 44px;
}

.placecard {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  margin-top: 16px;
  min-height: 44px;
}

.placebody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.placelabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.placeselect {
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  background: transparent;
  border: none;
  padding: 0;
  min-height: 24px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.placestreet {
  font-size: 12px;
  color: var(--muted);
}

.section {
  padding: 20px 20px 0 20px;
}

.sectiontitle {
  font-weight: 650;
  font-size: 16px;
  margin-bottom: 10px;
}

.notitlegap {
  margin-bottom: 0;
}

.actionlist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actioncard {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 13px 14px;
  min-height: 44px;
  width: 100%;
  transition: background 0.15s, border-color 0.15s;
}

.actioncard .check {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.actioncard.sel {
  background: var(--green-soft);
  border-color: var(--green);
  box-shadow: inset 0 0 0 1px var(--green);
}

.actioncard.sel .check {
  opacity: 1;
}

.actionicon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.actionicon.brought {
  background: var(--green);
}

.actionicon.taken {
  background: var(--green-mist);
}

.actionicon.empty {
  background: var(--gray-soft);
}

.actionbody {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.actiontitle {
  font-size: 15px;
  font-weight: 600;
}

.actionnote {
  font-size: 12px;
  color: #4a5a4e;
}

.subsectiontitle {
  font-weight: 650;
  font-size: 14px;
  color: var(--muted);
  margin: 16px 0 8px 0;
}

.conditioncard {
  padding: 10px 14px;
}

.conditionicon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--green-mist);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conditiontitle {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.regelnlink {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.tagshead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tagsnote {
  font-size: 12px;
  color: var(--muted);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.foodchip {
  background: var(--surface);
  border: 1px solid #e2ded0;
  border-radius: 999px;
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 500;
  min-height: 44px;
  transition: background 0.15s, color 0.15s;
}

.foodchip[aria-pressed='true'] {
  background: var(--green);
  color: var(--surface);
  border-color: var(--green);
  font-weight: 600;
}

.submitblock {
  padding: 24px 20px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.submiterror {
  background: #f6e3dc;
  color: #8a3b2a;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.sendbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--green);
  color: var(--surface);
  border-radius: 999px;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 600;
  min-height: 44px;
  box-shadow: 0 5px 14px rgba(47, 125, 84, 0.35);
}

.sendbtn:disabled {
  opacity: 0.6;
  cursor: default;
}

.finenote {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin: 0;
}
</style>
