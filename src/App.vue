<script setup>
// === IMPORTS ===
// Vue-Funktionen, die wir brauchen:
// - ref: erstellt reaktive Variablen (ändern sich automatisch in der UI)
// - onMounted: wird ausgeführt, sobald die Komponente geladen ist
// - watch: überwacht Änderungen an Variablen
// - computed: berechnet Werte automatisch neu, wenn sich Abhängigkeiten ändern
import {ref, onMounted, watch, computed} from "vue";

// === KONSTANTEN ===
// Der Schlüssel, unter dem wir die Events im localStorage speichern
const STORAGE_KEY = "lifepath.events.v1";

// Die 3 festen Kategorien (Tracks) für deine Events
// Jeder Track hat eine ID (zum Speichern) und ein Label (zum Anzeigen)
const TRACKS = [
  { id: "career", label: "Karriere" },
  { id: "family", label: "Familie" },
  { id: "travel", label: "Reisen" },
];

// === REAKTIVE DATEN ===
// ref() macht eine Variable "reaktiv" = wenn sie sich ändert,
// updated Vue automatisch die UI

// events.value = das Array mit allen gespeicherten Events
// Startinhalt: 3 Demo-Events (werden später durch localStorage überschrieben)
const events = ref([
  { id: "1", track: "career", date: "2024-03-01", title: "Job gestartet", text: "..." },
  { id: "2", track: "career", date: "2025-01-15", title: "Projekt X", text: "..." },
  { id: "3", track: "travel", date: "2025-08-10", title: "Reise nach Rom", text: "..." },
]);

// === LIFECYCLE: onMounted ===
// Wird EINMAL ausgeführt, sobald die App startet
onMounted(() => {
  // Lade gespeicherte Events aus dem localStorage
  const saved = loadEvents();

  // Wenn es gespeicherte Events gibt, ersetze die Demo-Events
  // Sonst bleiben die Demo-Events
  if (saved.length > 0) {
    events.value = saved;
  }
});

// === FORMULAR-FELDER ===
// Diese Variablen sind an die Input-Felder im Formular gebunden (v-model)
const formTrack = ref("career");    // Welcher Track ausgewählt ist
const formDate = ref("2026-02-02"); // Welches Datum eingegeben wurde
const formTitle = ref("");          // Der Titel des Events
const formText = ref("");           // Der Beschreibungstext

// === EDIT-MODUS ===
// selectedId speichert die ID des Events, das gerade bearbeitet wird
// null = kein Event ausgewählt (Erstellen-Modus)
// "123" = Event mit ID "123" wird bearbeitet
const selectedId = ref(null);

// === TRACK-NAVIGATION ===
// activeTrack speichert, welcher Track gerade geöffnet ist
// null = Track-Übersicht wird angezeigt
// "career" = Karriere-Track ist geöffnet
const activeTrack = ref(null);

// === COMPUTED: eventsByTrack ===
// computed = wird automatisch neu berechnet, wenn sich events.value ändert
// Gruppiert alle Events nach ihrem Track und sortiert sie
const eventsByTrack = computed(() => {
  // Erstelle ein Objekt mit leeren Arrays für jeden Track
  const grouped = {
    career: [],
    family: [],
    travel: [],
  };

  // Durchlaufe alle Events und sortiere sie in die richtige Kategorie
  for (const e of events.value) {
    grouped[e.track].push(e);
  }

  // Sortiere die Events in jedem Track nach Datum (neueste zuerst)
  // localeCompare vergleicht Strings alphabetisch
  // b.date.localeCompare(a.date) = absteigende Sortierung
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => b.date.localeCompare(a.date));
  }

  return grouped;
});

// === COMPUTED: timelineRange ===
// Findet das früheste und späteste Datum aller Events
// Wird für die Timeline-Positionierung gebraucht
const timelineRange = computed(() => {
  // Wenn keine Events existieren, gib null zurück
  if (events.value.length === 0) return null;

  // Extrahiere alle Daten und sortiere sie
  const dates = events.value.map(e => e.date).sort();

  // Gib das kleinste und größte Datum zurück
  return {
    min: dates[0],                    // Frühestes Datum
    max: dates[dates.length - 1],     // Spätestes Datum
  };
});

// === HILFSFUNKTIONEN ===

// Generiert eine eindeutige ID für neue Events
// Math.random() + Date.now() = sehr wahrscheinlich einzigartig
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Berechnet die Position eines Events auf der Timeline (0-100%)
// Beispiel: Event liegt genau in der Mitte → 50%
function dateToPercent(date, minDate, maxDate) {
  // Wandle alle Daten in Millisekunden um
  const d = new Date(date).getTime();
  const min = new Date(minDate).getTime();
  const max = new Date(maxDate).getTime();

  // Sonderfall: Wenn nur 1 Event existiert, zeige es in der Mitte
  if (max === min) return 50;

  // Berechne die prozentuale Position zwischen min und max
  return ((d - min) / (max - min)) * 100;
}

// === SPEICHERN & LADEN ===

// Speichert das Events-Array im localStorage
function saveEvents(list) {
  // JSON.stringify wandelt das Array in einen String um
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Lädt Events aus dem localStorage
function loadEvents() {
  // Hole den gespeicherten String
  const raw = localStorage.getItem(STORAGE_KEY);

  // Wenn nichts gespeichert ist, gib leeres Array zurück
  if (!raw) {
    return [];
  }

  // Versuche den String in ein Array zu parsen
  try {
    return JSON.parse(raw);
  } catch {
    // Falls der String kaputt ist, gib leeres Array zurück
    return [];
  }
}

// === EVENT HINZUFÜGEN / BEARBEITEN ===
function addEvent() {
  // Hole die Werte aus dem Formular und entferne Leerzeichen
  const title = formTitle.value.trim();
  const text = formText.value.trim();
  const date = formDate.value;

  // Validierung: Titel muss ausgefüllt sein
  if (!title) {
    alert("Bitte gib einen Titel ein.");
    return;
  }

  // 🔁 FALL 1: Event bearbeiten (selectedId ist gesetzt)
  if (selectedId.value) {
    // Finde das Event im Array
    const index = events.value.findIndex(e => e.id === selectedId.value);
    if (index === -1) return; // Event nicht gefunden? Abbrechen.

    // Überschreibe das Event mit den neuen Daten
    events.value[index] = {
      ...events.value[index],  // Behalte die alte ID
      track: formTrack.value,
      date,
      title,
      text,
    };

    // Formular zurücksetzen
    resetForm();
    return;
  }

  // ➕ FALL 2: Neues Event erstellen (selectedId ist null)
  const newEvent = {
    id: uid(),                 // Generiere neue ID
    track: formTrack.value,
    date,
    title,
    text,
  };

  // Füge das neue Event am Anfang des Arrays ein
  events.value.unshift(newEvent);

  // Leere nur Titel und Text, behalte Track und Datum
  formTitle.value = "";
  formText.value = "";
}

// === WATCHER: Auto-Speichern ===
// watch überwacht events.value auf Änderungen
// Immer wenn sich das Array ändert, wird automatisch gespeichert
watch(
    events,
    (newEvents) => {
      saveEvents(newEvents);
    },
    { deep: true }  // deep: true = auch Änderungen in Objekten im Array erkennen
);

// === EVENT AUSWÄHLEN (für Bearbeitung) ===
function selectEvent(id) {
  // Finde das Event mit dieser ID
  const event = events.value.find(e => e.id === id);
  if (!event) return;

  // Merke die ID (wir sind jetzt im Edit-Modus)
  selectedId.value = id;

  // Fülle das Formular mit den Event-Daten
  formTrack.value = event.track;
  formDate.value = event.date;
  formTitle.value = event.title;
  formText.value = event.text;
}

// === EVENT LÖSCHEN ===
function deleteEvent(id) {
  // Sicherheitsabfrage
  const ok = confirm("Wirklich löschen?");
  if (!ok) return;

  // Filtere das Event aus dem Array
  // filter() erstellt ein neues Array ohne das gelöschte Event
  events.value = events.value.filter(e => e.id !== id);

  // Falls das gelöschte Event gerade bearbeitet wurde, verlasse Edit-Modus
  if (selectedId.value === id) {
    resetForm();
  }
}

// === FORMULAR ZURÜCKSETZEN ===
function resetForm() {
  selectedId.value = null;                           // Verlasse Edit-Modus
  formTrack.value = "career";                        // Standard-Track
  formDate.value = new Date().toISOString().slice(0, 10); // Heutiges Datum
  formTitle.value = "";
  formText.value = "";
}

// === TRACK-NAVIGATION ===
// Öffnet einen bestimmten Track (z.B. "career")
function openTrack(trackId) {
  activeTrack.value = trackId;
  resetForm(); // Optional: Formular leeren beim Wechsel
}

// Schließt den aktuellen Track und kehrt zur Übersicht zurück
function closeTrack() {
  activeTrack.value = null;
  resetForm();
}
</script>

<template>
  <!-- Haupt-Container mit Tailwind-Klassen -->
  <!-- p-4 = padding, max-w-3xl = maximale Breite, mx-auto = zentriert -->
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">LifePath (Step 1)</h1>

    <!-- SEKTION: Timeline-Übersicht -->
    <section class="border rounded p-3 mb-4">
      <h2 class="font-semibold mb-2">Zeitstrahlen</h2>

      <!-- ANSICHT 1: Track-Auswahl (wenn kein Track geöffnet ist) -->
      <div v-if="!activeTrack" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Zeige einen Button für jeden Track -->
        <button
            v-for="t in TRACKS"
            :key="t.id"
            class="border rounded p-4 text-left hover:bg-neutral-50"
            @click="openTrack(t.id)"
        >
          <div class="font-semibold">{{ t.label }}</div>
          <!-- Zeige die Anzahl der Events in diesem Track -->
          <div class="text-sm text-gray-600">
            {{ eventsByTrack[t.id].length }} Events
          </div>
        </button>
      </div>

      <!-- ANSICHT 2: Timeline eines Tracks (wenn Track geöffnet ist) -->
      <div v-else>
        <!-- Header mit Track-Name und Zurück-Button -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">
            <!-- Finde das Label des aktuellen Tracks -->
            {{ TRACKS.find(x => x.id === activeTrack)?.label }}
          </h3>

          <button class="border rounded px-3 py-2" @click="closeTrack">
            ← Zurück
          </button>
        </div>

        <!-- Timeline-Visualisierung (dunkler Hintergrund mit Linie) -->
        <div class="relative w-full h-24 bg-neutral-900 rounded border border-neutral-700">
          <!-- Horizontale Linie in der Mitte -->
          <div class="absolute left-4 right-4 top-1/2 h-0.5 bg-neutral-500"></div>

          <!-- Event-Marker auf der Timeline -->
          <div
              v-for="e in eventsByTrack[activeTrack]"
              :key="e.id"
              class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
              :style="{
                // Berechne die horizontale Position basierend auf dem Datum
                left: timelineRange
                  ? dateToPercent(e.date, timelineRange.min, timelineRange.max) + '%'
                  : '50%'
              }"
              @click="selectEvent(e.id)"
          >
            <!-- Kreis-Marker (Stern-Platzhalter) -->
            <div
                class="h-3 w-3 rounded-full bg-white border-2"
                :class="e.id === selectedId ? 'border-white' : 'border-neutral-400'"
            ></div>
            <!-- Titel unter dem Marker -->
            <div class="mt-2 text-xs text-center max-w-[120px] text-neutral-300">
              {{ e.title }}
            </div>
          </div>
        </div>

        <!-- Datums-Labels (Anfang & Ende der Timeline) -->
        <div class="flex justify-between text-xs text-neutral-500 mt-1 px-4">
          <span>{{ timelineRange?.min }}</span>
          <span>{{ timelineRange?.max }}</span>
        </div>
      </div>
    </section>

    <!-- SEKTION: Formular zum Erstellen/Bearbeiten -->
    <section class="border rounded p-3">
      <!-- Titel ändert sich je nach Modus -->
      <h2 class="font-semibold mb-2">
        {{ selectedId ? "Event bearbeiten" : "Neues Event" }}
      </h2>

      <!-- @submit.prevent = verhindert Seiten-Reload beim Absenden -->
      <form class="space-y-2" @submit.prevent="addEvent">
        <!-- Track-Auswahl -->
        <div>
          <label class="text-sm text-gray-600">Track</label>
          <!-- v-model bindet den Wert an formTrack -->
          <select v-model="formTrack" class="border rounded px-2 py-2 w-full">
            <option v-for="t in TRACKS" :key="t.id" :value="t.id">
              {{ t.label }}
            </option>
          </select>
        </div>

        <!-- Datums-Auswahl -->
        <div>
          <label class="text-sm text-gray-600">Datum</label>
          <input v-model="formDate" type="date" class="border rounded px-2 py-2 w-full" />
        </div>

        <!-- Titel-Eingabe -->
        <div>
          <label class="text-sm text-gray-600">Titel</label>
          <input v-model="formTitle" class="border rounded px-2 py-2 w-full" />
        </div>

        <!-- Text-Eingabe -->
        <div>
          <label class="text-sm text-gray-600">Text</label>
          <textarea v-model="formText" rows="4" class="border rounded px-2 py-2 w-full"></textarea>
        </div>

        <!-- Submit-Button (Text ändert sich je nach Modus) -->
        <button class="px-3 py-2 border rounded bg-black text-white" type="submit">
          {{ selectedId ? "Speichern" : "Hinzufügen" }}
        </button>

        <!-- Abbrechen-Button -->
        <button class="px-3 py-2 border rounded" type="button" @click="resetForm">
          Abbrechen
        </button>
      </form>
    </section>
  </div>
</template>