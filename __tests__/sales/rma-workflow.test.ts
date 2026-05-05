import { StateMachine } from '../../src/lib/state-machine';

describe('RMA State Machine', () => {
    let rmaStateMachine: StateMachine<string>;

    beforeAll(() => {
        const rmaTransitions = {
            REQUESTED: ['APPROVED', 'REJECTED'],
            APPROVED: ['RECEIVED'],
            RECEIVED: ['INSPECTED'],
            INSPECTED: ['REFUNDED', 'RESTOCKED', 'SCRAPPED'],
            REJECTED: [],
            REFUNDED: [],
            RESTOCKED: [],
            SCRAPPED: []
        };
        rmaStateMachine = new StateMachine('RMA', rmaTransitions);
    });

    it('should allow REQUESTED to APPROVED', () => {
        expect(rmaStateMachine.canTransition('REQUESTED', 'APPROVED')).toBe(true);
    });

    it('should allow REQUESTED to REJECTED', () => {
        expect(rmaStateMachine.canTransition('REQUESTED', 'REJECTED')).toBe(true);
    });

    it('should NOT allow REQUESTED to RECEIVED', () => {
        expect(rmaStateMachine.canTransition('REQUESTED', 'RECEIVED')).toBe(false);
    });

    it('should allow INSPECTED to REFUNDED, RESTOCKED, SCRAPPED', () => {
        expect(rmaStateMachine.canTransition('INSPECTED', 'REFUNDED')).toBe(true);
        expect(rmaStateMachine.canTransition('INSPECTED', 'RESTOCKED')).toBe(true);
        expect(rmaStateMachine.canTransition('INSPECTED', 'SCRAPPED')).toBe(true);
    });

    it('should NOT allow moving from REFUNDED to anywhere else', () => {
        expect(rmaStateMachine.getValidTransitions('REFUNDED').length).toBe(0);
        expect(rmaStateMachine.canTransition('REFUNDED', 'APPROVED')).toBe(false);
    });
});
