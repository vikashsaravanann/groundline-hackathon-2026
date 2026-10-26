# Acceptance criteria — vertical slice

This file defines what "done" means for the Groundline vertical slice. It is the
line between completion and progress. Each condition below is testable: given a
single run of the slice, it is either true or false, with no judgement call. The
slice is accepted only when every numbered condition holds.

## Conditions

1. No camera frame is captured until the user has given explicit consent; with
   consent withheld, zero frames are read from the camera.
2. A camera frame is captured only after that consent is recorded, and the
   captured frame is the one passed to the model.
3. The model returns a structured result (not free text) that names the target
   object as an explicit field.
4. A mask or bounding box is produced for the target, and its region lies over
   the correct object in the captured image.
5. A JSON action plan is produced that validates against the agreed schema; an
   output that fails schema validation is not treated as a plan.
6. The action plan carries, for its target, both an evidence reference and a
   numeric confidence value.
7. If the plan's target domain is not on the allowlist, the plan is rejected and
   no browser step runs for it.
8. If the plan's target domain is on the allowlist, a sandboxed browser opens the
   draft form and fills it from the plan.
9. Nothing is submitted until a human approves: with approval withheld, the form
   is never submitted and no network submission leaves the sandbox.
10. On explicit human approval, and only then, the draft is submitted.
11. Every proposal, every approval, and every rejection is written to the audit
    record as a distinct, timestamped entry.
12. The whole path — consent, capture, grounding, plan, allowlist check, draft
    fill, approval gate, audit — runs end to end in a single run with no manual
    step wedged between stages.

## Out of scope

The following are explicitly excluded from the vertical slice. Their absence is
not a failure of acceptance:

- Payments of any kind.
- Real submissions to live external systems.
- Account creation.
- Medical content.
- Any non-synthetic document.
