<script setup>
import {ref, onMounted, watch, computed} from "vue";

const STORAGE_KEY = "lifepath.events.v1";

// 3 feste Tracks (für Phase 1)
const TRACKS = [
  { id: "career", label: "Karriere" },
  { id: "family", label: "Familie" },
  { id: "travel", label: "Reisen" },
];


// Hier speichern wir unsere Events (erstmal nur im Speicher)
const events = ref([
  { id: "1", track: "career", date: "2024-03-01", title: "Job gestartet", text: "..." },
  { id: "2", track: "career", date: "2025-01-15", title: "Projekt X", text: "..." },
  { id: "3", track: "travel", date: "2025-08-10", title: "Reise nach Rom", text: "..." },
]);


onMounted(() => {
  const saved = loadEvents();

  // Wenn localStorage leer ist, behalten wir das Demo-Event
  if (saved.length > 0) {
    events.value = saved;
  }
});

// Form-Felder für ein neues Event
const formTrack = ref("career");
const formDate = ref("2026-02-02");
const formTitle = ref("");
const formText = ref("");
// Merkt sich die ID des aktuell ausgewählten Events (für Edit)
const selectedId = ref(null);
const activeTrack = ref(null);



// Events pro Track gruppiert & nach Datum sortiert
const eventsByTrack = computed(() => {
  const grouped = {
    career: [],
    family: [],
    travel: [],
  };

  for (const e of events.value) {
    grouped[e.track].push(e);
  }

  // Sortierung: neueste zuerst
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => b.date.localeCompare(a.date));
  }

  return grouped;
});

// Gesamter Zeitbereich (min/max Datum) für die Positionierung
const timelineRange = computed(() => {
  if (events.value.length === 0) return null;

  const dates = events.value.map(e => e.date).sort();
  return {
    min: dates[0],
    max: dates[dates.length - 1],
  };
});


function uid() {
  // Kombi aus Zufall + Zeit -> für MVP reicht das
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Wandelt ein Datum in eine Prozent-Position (0..100) um
function dateToPercent(date, minDate, maxDate) {
  const d = new Date(date).getTime();
  const min = new Date(minDate).getTime();
  const max = new Date(maxDate).getTime();

  if (max === min) return 50; // wenn nur ein Datum existiert
  return ((d - min) / (max - min)) * 100;
}


// Events im localStorage speichern
function saveEvents(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Events aus localStorage laden
function loadEvents() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    // Noch nichts gespeichert
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    // Falls etwas kaputt ist
    return [];
  }
}

// Mini-Funktion: neues Event hinzufügen
function addEvent() {
  const title = formTitle.value.trim();
  const text = formText.value.trim();
  const date = formDate.value;

  if (!title) {
    alert("Bitte gib einen Titel ein.");
    return;
  }

  // 🔁 FALL 1: Event bearbeiten
  if (selectedId.value) {
    const index = events.value.findIndex(e => e.id === selectedId.value);
    if (index === -1) return;

    events.value[index] = {
      ...events.value[index],
      track: formTrack.value,
      date,
      title,
      text,
    };

    resetForm();
    return;
  }

  // ➕ FALL 2: Neues Event anlegen
  const newEvent = {
    id: uid(),
    track: formTrack.value,
    date,
    title,
    text,
  };

  events.value.unshift(newEvent);
  formTitle.value = "";
  formText.value = "";
}

// Immer speichern, wenn sich die Events ändern
watch(
    events,
    (newEvents) => {
      saveEvents(newEvents);
    },
    { deep: true }
);

// Wird aufgerufen, wenn man ein Event in der Liste anklickt
function selectEvent(id) {
  const event = events.value.find(e => e.id === id);
  if (!event) return;

  // ID merken (wir sind jetzt im Edit-Modus)
  selectedId.value = id;

  // Formular mit Event-Daten füllen
  formTrack.value = event.track;
  formDate.value = event.date;
  formTitle.value = event.title;
  formText.value = event.text;
}

// Löscht ein Event anhand der ID
function deleteEvent(id) {
  const ok = confirm("Wirklich löschen?");
  if (!ok) return;

  // entfernt das Event aus dem Array
  events.value = events.value.filter(e => e.id !== id);

  // falls gerade das gelöschte Event ausgewählt war: Edit-Modus verlassen
  if (selectedId.value === id) {
    resetForm();
  }
}


// Formular leeren & Edit-Modus verlassen
function resetForm() {
  selectedId.value = null;
  formTrack.value = "career";
  formDate.value = new Date().toISOString().slice(0, 10);
  formTitle.value = "";
  formText.value = "";
}

function openTrack(trackId) {
  activeTrack.value = trackId;
  resetForm(); // optional: Formular zurücksetzen beim Wechsel
}

function closeTrack() {
  activeTrack.value = null;
  resetForm();
}


</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">LifePath (Step 1)</h1>

    <!-- Liste -->
    <section class="border rounded p-3 mb-4">
      <h2 class="font-semibold mb-2">Zeitstrahlen</h2>

      <!--Track Auswahl-->
      <div v-if="!activeTrack" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
            v-for="t in TRACKS"
            :key="t.id"
            class="border rounded p-4 text-left hover:bg-neutral-50"
            @click="openTrack(t.id)"
        >
          <div class="font-semibold">{{ t.label }}</div>
          <div class="text-sm text-gray-600">
            {{ eventsByTrack[t.id].length }} Events
          </div>
        </button>
      </div>
      <div v-else>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">
            {{ TRACKS.find(x => x.id === activeTrack)?.label }}
          </h3>

          <button class="border rounded px-3 py-2" @click="closeTrack">
            ← Zurück
          </button>
        </div>

        <!--Timeline Anzeige-->
        <div class="relative w-full h-24 bg-neutral-900 rounded border border-neutral-700">
          <div class="absolute left-4 right-4 top-1/2 h-0.5 bg-neutral-500"></div>

          <div
              v-for="e in eventsByTrack[activeTrack]"
              :key="e.id"
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
              :style="{
          left: timelineRange
            ? dateToPercent(e.date, timelineRange.min, timelineRange.max) + '%'
            : '50%'
        }"
              @click="selectEvent(e.id)"
          >
            <div
                class="h-3 w-3 rounded-full bg-white border-2"
                :class="e.id === selectedId ? 'border-white' : 'border-neutral-400'"
            ></div>
            <div class="mt-2 text-xs text-center max-w-[120px] text-neutral-300">
              {{ e.title }}
            </div>
          </div>
        </div>

        <div class="flex justify-between text-xs text-neutral-500 mt-1 px-4">
          <span>{{ timelineRange?.min }}</span>
          <span>{{ timelineRange?.max }}</span>
        </div>
      </div>
    </section>


    <!-- Formular -->
    <section class="border rounded p-3">
      <h2 class="font-semibold mb-2">
        {{ selectedId ? "Event bearbeiten" : "Neues Event" }}
      </h2>

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
          {{ selectedId ? "Speichern" : "Hinzufügen" }}
        </button>

        <button class="px-3 py-2 border rounded" type="button" @click="resetForm">
          Abbrechen
        </button>
      </form>
    </section>
  </div>
</template>
