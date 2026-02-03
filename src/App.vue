<script setup>
import {ref, onMounted, watch} from "vue";

const STORAGE_KEY = "lifepath.events.v1";

// 3 feste Tracks (für Phase 1)
const TRACKS = [
  { id: "career", label: "Karriere" },
  { id: "family", label: "Familie" },
  { id: "travel", label: "Reisen" },
];


// Hier speichern wir unsere Events (erstmal nur im Speicher)
const events = ref([  {
    id: "1",
    track: "career",
    date: "2026-02-02",
    title: "LifePath gestartet",
    text: "Erstes Mini-MVP in Vue.",
  },
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

function uid() {
  // Kombi aus Zufall + Zeit -> für MVP reicht das
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
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
    <h1 class="text-2xl font-bold mb-4">LifePath (Step 1)</h1>

    <!-- Liste -->
    <section class="border rounded p-3 mb-4">
      <h2 class="font-semibold mb-2">Events</h2>

      <ul class="space-y-2">
        <li
            v-for="e in events"
            :key="e.id"
            class="border rounded p-2 cursor-pointer"
            :class="e.id === selectedId ? 'bg-gray-100' : ''"
            @click="selectEvent(e.id)"
        >
          <div class="text-sm text-gray-600">
            {{ e.date }} • {{ e.track }}
          </div>
          <div class="font-medium">{{ e.title }}</div>
          <div class="text-sm text-gray-700">{{ e.text }}</div>
          <button
              class="mt-2 px-2 py-1 border rounded text-sm"
              @click.stop="deleteEvent(e.id)"
          >
            Löschen
          </button>
        </li>
      </ul>
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
