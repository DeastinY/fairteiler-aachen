<script setup lang="ts">
import LegalPage from '../components/LegalPage.vue'
import { t } from '../i18n'
</script>

<template>
  <LegalPage :title="t('regeln.title')">
    <p>{{ t('regeln.intro') }}</p>

    <h2>{{ t('regeln.notTitle') }}</h2>
    <ul>
      <li>{{ t('regeln.not1') }}</li>
      <li>{{ t('regeln.not2') }}</li>
      <li>{{ t('regeln.not3') }}</li>
      <li>{{ t('regeln.not4') }}</li>
    </ul>
    <p>{{ t('regeln.notice') }}</p>

    <h2>{{ t('regeln.okTitle') }}</h2>
    <ul>
      <li>{{ t('regeln.ok1') }}</li>
      <li>{{ t('regeln.ok2') }}</li>
    </ul>

    <h2>{{ t('regeln.careTitle') }}</h2>
    <ul>
      <li>{{ t('regeln.care1') }}</li>
      <li>{{ t('regeln.care2') }}</li>
      <li>{{ t('regeln.care3') }}</li>
      <li>{{ t('regeln.care4') }}</li>
      <li>{{ t('regeln.care5') }}</li>
      <li>{{ t('regeln.care6') }}</li>
      <li>{{ t('regeln.care7') }}</li>
    </ul>

    <p class="footer">{{ t('regeln.footer') }}</p>
  </LegalPage>
</template>

<style scoped>
ul {
  margin: 10px 0 0 0;
  padding-inline-start: 20px;
  font-size: 14px;
  line-height: 1.6;
}

li + li {
  margin-top: 4px;
}

.footer {
  color: var(--muted);
  font-size: 13px;
  margin-top: 22px;
}
</style>
