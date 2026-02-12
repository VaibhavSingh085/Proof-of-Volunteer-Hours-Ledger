// Contract witnesses - Counter uses privateCounter; LegalDoc uses none
// Counter (from example-counter) requires this type for deployment

export type CounterPrivateState = {
  privateCounter: number;
};

export type LegalDocPrivateState = Record<string, never>;

export const witnesses = {};
