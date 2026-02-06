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

</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">LifePath (Step 1)</h1>

    <!-- Liste -->
    <section class="border rounded p-3 mb-4">
      <h2 class="font-semibold mb-2">Events</h2>

      <div class="space-y-8">
        <div v-for="t in TRACKS" :key="t.id">
          <h3 class="font-semibold mb-2">{{ t.label }}</h3>

          <div class="text-xs text-red-500">
            Debug: {{ eventsByTrack[t.id].length }} events in {{ t.id }}
          </div>
          <!-- Horizontale Timeline -->
          <div class="relative h-24 bg-white rounded border border-red-500">
            <div class="absolute left-2 right-2 top-6 h-2 bg-red-500 rounded"></div>

            <div
                v-for="e in eventsByTrack[t.id]"
                :key="e.id"
                class="absolute top-2 -translate-x-1/2 cursor-pointer"
                :style="{
    left: timelineRange
      ? dateToPercent(e.date, timelineRange.min, timelineRange.max) + '%'
      : '50%'
  }"
                @click="selectEvent(e.id)"
            >
              <!-- Punkt -->
              <div
                  class="h-3 w-3 rounded-full border relative"
                  :class="e.id === selectedId ? 'border-black bg-black' : 'border-gray-400 bg-white'"
              ></div>

              <!-- Datum -->
              <div class="text-xs text-gray-600 mt-2 whitespace-nowrap">
                {{ e.date }}
              </div>

              <!-- Titel -->
              <div class="text-xs text-center mt-1 max-w-[120px]">
                {{ e.title }}
              </div>
              <!-- Löschen -->
              <button
                  class="mt-2 px-2 py-1 border rounded text-xs"
                  @click.stop="deleteEvent(e.id)"
              >
                Löschen
              </button>
            </div>

            <p
                v-if="eventsByTrack[t.id].length === 0"
                class="text-sm text-gray-500"
            >
              Noch keine Events.
            </p>
          </div>
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
