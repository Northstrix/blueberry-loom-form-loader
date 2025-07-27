<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const pageTitle = ref("Blueberry Loom");

watch(
  pageTitle,
  (newTitle) => {
    if (typeof newTitle === "string" && newTitle.trim().length > 0) {
      document.title = newTitle.trim();
    }
  },
  { immediate: true }
);

setTimeout(() => {
  pageTitle.value = "Blueberry Loom";
}, 2000);

</script>

<style src="~/assets/css/global.css" />
