import { describe, expect, it } from "vitest";
import {
  canTransitionMilestone,
  canTransitionPayout,
  canTransitionSubmission,
} from "../src/lib/state-machine";

describe("state machine", () => {
  it("allows submitted -> under_review -> approved", () => {
    expect(canTransitionSubmission("draft", "submitted")).toBe(true);
    expect(canTransitionSubmission("submitted", "under_review")).toBe(true);
    expect(canTransitionSubmission("under_review", "approved")).toBe(true);
    expect(canTransitionSubmission("approved", "submitted")).toBe(false);
  });

  it("allows revision loop", () => {
    expect(canTransitionSubmission("under_review", "revision_requested")).toBe(true);
    expect(canTransitionSubmission("revision_requested", "resubmitted")).toBe(true);
    expect(canTransitionSubmission("resubmitted", "under_review")).toBe(true);
    expect(canTransitionSubmission("under_review", "approved")).toBe(true);
  });

  it("milestone transitions respect approval gate", () => {
    expect(canTransitionMilestone("awaiting_submission", "under_review")).toBe(true);
    expect(canTransitionMilestone("under_review", "approved")).toBe(true);
    expect(canTransitionMilestone("approved", "payout_triggered")).toBe(true);
    expect(canTransitionMilestone("payout_triggered", "settled")).toBe(true);
    expect(canTransitionMilestone("awaiting_submission", "payout_triggered")).toBe(false);
  });

  it("payout cannot jump from ready to confirmed", () => {
    expect(canTransitionPayout("ready", "triggered")).toBe(true);
    expect(canTransitionPayout("triggered", "confirmed")).toBe(true);
    expect(canTransitionPayout("ready", "confirmed")).toBe(false);
    expect(canTransitionPayout("confirmed", "ready")).toBe(false);
  });
});
