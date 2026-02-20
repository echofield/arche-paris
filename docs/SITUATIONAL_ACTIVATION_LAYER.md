# Situational Ritual Activation Layer

This layer defines activation as situated transformation, not correctness.

## Invariants

- No quiz/correct-answer gating.
- Activation depends on:
  - object semantics (artifact type + tags),
  - walker complexion (Presence/Wisdom/Shadow),
  - lived context (dwell, revisit, local ritual density).
- Output is a transformation potential and opacity reduction of the city signal.
- All activation must preserve `Walk -> Reveal -> Feel -> Return` as base loop.
- Nothing created can exist without a place.
- Emotional OS targets must remain possible: Unveiling, Stewardship, Inheritance, Refusal.
- Meaning requires friction: every creative act must pass at least one gate (time/space/existential).

## Canonical Acts Only

- `Witness`
- `Consecrate`
- `Guard`
- `Testify`
- `Integrate`

## Creative Primitive Gate

Activation layer may emit only these primitive intents:
- `inscription`
- `link_places`
- `leave_question`
- `repeat_ritual`
- `sequence_detection`

No editors/builders/dashboards in this layer.

## Friction Gate (Constitutional)

At least one gate must pass:
- `Time friction`
  - Minimum lived duration before validation.
- `Space friction`
  - Real displacement before validation.
- `Existential friction`
  - Zone consciousness + complexion alignment may trigger refusal.

If none passes:
- activation is closed
- response remains opaque: `The place remains closed.`
- no optimization hint is returned

## Engine Contract

Module: `src/utils/situational-activation.ts`

- Input: `ActivationInput`
- Output: `ActivationResult`
  - `validActs[]` with intensity per canonical act
  - `opacityReduction` (city becomes more legible through presence)
  - `transformationPotential` (situational existential delta)
