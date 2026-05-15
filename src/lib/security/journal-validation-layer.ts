export class JournalValidationLayer {
  /**
   * Prevents direct mutation of posted journal entries.
   * Only reversal operations are permitted for posted entries.
   */
  static protectPostedJournals(journalEntry: any) {
    if (journalEntry.status === 'POSTED') {
      throw new Error('JOURNAL_VALIDATION_ERROR: Cannot mutate a posted journal entry. Please perform a reversal instead.');
    }
    return true;
  }

  /**
   * Enforces that reversals maintain an immutable audit trail.
   */
  static validateReversalContext(originalJournalId: number | string, reversalNotes: string) {
    if (!originalJournalId) {
       throw new Error('JOURNAL_VALIDATION_ERROR: Reversal requires reference to the original Journal ID.');
    }
    if (!reversalNotes || reversalNotes.trim().length === 0) {
       throw new Error('JOURNAL_VALIDATION_ERROR: Reversal requires explicit justification notes.');
    }
    return true;
  }
}
