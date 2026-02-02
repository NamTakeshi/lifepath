export type Track = "career" | "family" | "travel";

export interface LifeEvent {
    id: string;
    track: Track;
    date: string;  // "YYYY-MM-DD"
    title: string;
    text: string;
}
