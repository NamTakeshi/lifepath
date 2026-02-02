<script setup lang="ts">
import { ref } from "vue";
import type { LifeEvent, Track } from "./types";

// 3 feste Tracks (für Phase 1)
const TRACKS: { id: Track; label: string }[] = [
  { id: "career", label: "Karriere" },
  { id: "family", label: "Familie" },
  { id: "travel", label: "Reisen" },
];

// Hier speichern wir unsere Events (erstmal nur im Speicher)
const events = ref<LifeEvent[]>([
  {
    id: "1",
    track: "career",
    date: "2026-02-02",
    title: "LifePath gestartet",
    text: "Erstes Mini-MVP in Vue.",
  },
]);

// Form-Felder für ein neues Event
const formTrack = ref<Track>("career");
const formDate = ref("2026-02-02");
const formTitle = ref("");
const formText = ref("");

function uid(): string {
  // Kombi aus Zufall + Zeit -> für MVP reicht das
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}


// Mini-Funktion: neues Event hinzufügen
function addEvent() {
  // 1) Eingaben aufräumen (trim entfernt Leerzeichen am Anfang/Ende)
  const title = formTitle.value.trim();
  const text = formText.value.trim();
  const date = formDate.value;

  // 2) Mini-Validation: Titel muss da sein
  if (!title) {
    alert("Bitte gib einen Titel ein.");
    return;
  }

  // 3) Neues Event bauen
  const newEvent: LifeEvent = {
    id: uid(),
    track: formTrack.value,
    date: date,
    title: title,
    text: text,
  };

  // 4) In die Liste einfügen (wir packen es nach oben)
  events.value.unshift(newEvent);

  // 5) Formular leeren (Track & Datum lassen wir erstmal so)
  formTitle.value = "";
  formText.value = "";
}

</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">LifePath (Step 1)</h1>

    <!-- Liste -->
    <section class="border rounded p-3 mb-4">
      <h2 class="font-semibold mb-2">Events</h2>

      <ul class="space-y-2">
        <li v-for="e in events" :key="e.id" class="border rounded p-2">
          <div class="text-sm text-gray-600">
            {{ e.date }} • {{ e.track }}
          </div>
          <div class="font-medium">{{ e.title }}</div>
          <div class="text-sm text-gray-700">{{ e.text }}</div>
        </li>
      </ul>
    </section>

    <!-- Formular -->
    <section class="border rounded p-3">
      <h2 class="font-semibold mb-2">Neues Event</h2>

      <!-- Wenn das Formular abgeschickt wird, rufe die Funktion addEvent() auf. -->
      <form class="space-y-2" @submit.prevent="addEvent">
        <div>
          <label class="text-sm text-gray-600">Track</label>
          <select v-model="formTrack" class="border rounded px-2 py-2 w-full">
            <option v-for="t in TRACKS" :key="t.id" :value="t.id">
              {{ t.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600">Datum</label>
          <input v-model="formDate" type="date" class="border rounded px-2 py-2 w-full" />
        </div>

        <div>
          <label class="text-sm text-gray-600">Titel</label>
          <input v-model="formTitle" class="border rounded px-2 py-2 w-full" />
        </div>

        <div>
          <label class="text-sm text-gray-600">Text</label>
          <textarea v-model="formText" rows="4" class="border rounded px-2 py-2 w-full"></textarea>
        </div>

        <button class="px-3 py-2 border rounded bg-black text-white" type="submit">
          Hinzufügen
        </button>
      </form>
    </section>
  </div>
</template>
