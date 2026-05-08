import { getStateMachineFor } from '../../src/lib/state-machine';

describe('Document State Machine', () => {
    it('should throw error for undefined entity type', () => {
        expect(() => getStateMachineFor('INVALID')).toThrow();
    });

    describe('Invoice Transitions', () => {
        const machine = getStateMachineFor('INVOICE');

        it('should allow DRAFT -> SUBMITTED', () => {
            expect(machine.canTransition('DRAFT', 'SUBMITTED')).toBe(true);
        });

        it('should allow APPROVED -> POSTED', () => {
            expect(machine.canTransition('APPROVED', 'POSTED')).toBe(true);
        });

        it('should NOT allow DRAFT -> POSTED', () => {
            expect(machine.canTransition('DRAFT', 'POSTED')).toBe(false);
        });

        it('should NOT allow POSTED -> DELETED/DRAFT', () => {
            expect(machine.canTransition('POSTED', 'DRAFT')).toBe(false);
            // It only allows PAID, PARTIAL_PAID, REVERSED
            const valid = machine.getAllowedTransitions('POSTED');
            expect(valid).toEqual(['PAID', 'PARTIAL_PAID', 'REVERSED']);
        });

        it('should allow POSTED -> REVERSED', () => {
            expect(machine.canTransition('POSTED', 'REVERSED')).toBe(true);
        });
    });

    describe('Journal Entry Transitions', () => {
        const machine = getStateMachineFor('JOURNAL_ENTRY');

        it('should NOT allow POSTED -> REJECTED', () => {
            expect(machine.canTransition('POSTED', 'REJECTED')).toBe(false);
        });

        it('should allow POSTED -> REVERSED', () => {
            expect(machine.canTransition('POSTED', 'REVERSED')).toBe(true);
        });
    });
});
