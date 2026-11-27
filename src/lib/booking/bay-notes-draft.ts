const MAX_BAY_NOTES_DRAFTS = 10;

// Keep a typed bay note when the native back gesture returns to Select Time.
const bayNotesDraft = new Map<number, string>();

export function getBayNotesDraft(slotGroupId: number) {
    return bayNotesDraft.get(slotGroupId);
}

export function setBayNotesDraft(slotGroupId: number, notes: string) {
    bayNotesDraft.delete(slotGroupId);
    if (!notes) return;

    bayNotesDraft.set(slotGroupId, notes);
    if (bayNotesDraft.size > MAX_BAY_NOTES_DRAFTS) {
        const oldest = bayNotesDraft.keys().next();
        if (!oldest.done) bayNotesDraft.delete(oldest.value);
    }
}

export function clearBayNotesDrafts() {
    bayNotesDraft.clear();
}
