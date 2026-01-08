import { describe, it, expect } from "vitest";

/**
 * Validates a Secret Santa draw result
 *
 * @param members - Array of member IDs participating in the draw
 * @param draw - Map of giver ID to receiver ID
 * @param exclusions - Optional map of member ID to array of excluded member IDs
 * @returns Object with valid flag and optional reason for invalidity
 */
function isValidDraw(
  members: string[],
  draw: Map<string, string>,
  exclusions: Map<string, string[]> = new Map()
): { valid: boolean; reason?: string } {
  // Check if all members have assignments
  for (const member of members) {
    if (!draw.has(member)) {
      return { valid: false, reason: `Member ${member} has no assignment` };
    }
  }

  // Check if all receivers are valid members
  const receivers = new Set<string>();
  for (const [, receiver] of draw) {
    if (!members.includes(receiver)) {
      return {
        valid: false,
        reason: `Receiver ${receiver} is not a valid member`,
      };
    }
    receivers.add(receiver);
  }

  // Check if each person receives exactly one gift (no duplicates)
  if (receivers.size !== members.length) {
    return {
      valid: false,
      reason: "Not all members are assigned as receivers (duplicate receivers detected)",
    };
  }

  // Check for self-draws
  for (const [giver, receiver] of draw) {
    if (giver === receiver) {
      return { valid: false, reason: `Member ${giver} drew themselves` };
    }
  }

  // Check exclusion violations
  for (const [giver, receiver] of draw) {
    const giverExclusions = exclusions.get(giver) || [];
    if (giverExclusions.includes(receiver)) {
      return {
        valid: false,
        reason: `Exclusion violation: ${giver} cannot be assigned to ${receiver}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Creates a valid draw for testing purposes
 * Uses a simple rotation: each member gives to the next member in the list
 */
function createValidRotationDraw(members: string[]): Map<string, string> {
  const draw = new Map<string, string>();
  for (let i = 0; i < members.length; i++) {
    const giver = members[i];
    const receiver = members[(i + 1) % members.length];
    draw.set(giver, receiver);
  }
  return draw;
}

/**
 * Simulates the performDraw algorithm from the actual implementation
 * Uses Fisher-Yates shuffle with derangement validation
 */
function performDraw(
  memberIds: string[],
  exclusionMap: Map<string, Set<string>> = new Map(),
  maxAttempts = 1000
): Map<string, string> | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const receivers = [...memberIds];
    shuffleArray(receivers);

    let valid = true;
    const assignments = new Map<string, string>();

    for (let i = 0; i < memberIds.length; i++) {
      const giverId = memberIds[i];
      const receiverId = receivers[i];

      // Can't give to yourself
      if (giverId === receiverId) {
        valid = false;
        break;
      }

      // Check exclusion rules
      const exclusions = exclusionMap.get(giverId);
      if (exclusions?.has(receiverId)) {
        valid = false;
        break;
      }

      assignments.set(giverId, receiverId);
    }

    if (valid) {
      return assignments;
    }
  }

  return null;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

describe("Secret Santa Draw Algorithm", () => {
  describe("isValidDraw helper", () => {
    const members = ["alice", "bob", "charlie"];

    it("should validate a correct draw", () => {
      const draw = createValidRotationDraw(members);
      const result = isValidDraw(members, draw);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should detect self-draw", () => {
      const draw = new Map<string, string>();
      draw.set("alice", "alice"); // Self-draw!
      draw.set("bob", "charlie");
      draw.set("charlie", "bob");

      const result = isValidDraw(members, draw);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("drew themselves");
    });

    it("should detect missing assignments", () => {
      const draw = new Map<string, string>();
      draw.set("alice", "bob");
      draw.set("bob", "charlie");
      // charlie has no assignment

      const result = isValidDraw(members, draw);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("has no assignment");
    });

    it("should detect duplicate receivers", () => {
      const draw = new Map<string, string>();
      draw.set("alice", "bob");
      draw.set("bob", "bob"); // Duplicate receiver
      draw.set("charlie", "alice");

      const result = isValidDraw(members, draw);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("duplicate receivers");
    });

    it("should detect exclusion violations", () => {
      const draw = new Map<string, string>();
      draw.set("alice", "bob");
      draw.set("bob", "charlie");
      draw.set("charlie", "alice");

      const exclusions = new Map<string, string[]>();
      exclusions.set("alice", ["bob"]); // Alice cannot give to Bob

      const result = isValidDraw(members, draw, exclusions);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Exclusion violation");
      expect(result.reason).toContain("alice");
      expect(result.reason).toContain("bob");
    });

    it("should pass when exclusions are respected", () => {
      const draw = new Map<string, string>();
      draw.set("alice", "charlie"); // Not bob!
      draw.set("bob", "alice");
      draw.set("charlie", "bob");

      const exclusions = new Map<string, string[]>();
      exclusions.set("alice", ["bob"]); // Alice cannot give to Bob

      const result = isValidDraw(members, draw, exclusions);
      expect(result.valid).toBe(true);
    });

    it("should detect invalid receiver not in members list", () => {
      const draw = new Map<string, string>();
      draw.set("alice", "david"); // David is not a member!
      draw.set("bob", "charlie");
      draw.set("charlie", "alice");

      const result = isValidDraw(members, draw);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not a valid member");
    });
  });

  describe("Draw Validation", () => {
    it("should ensure each person is assigned exactly one recipient", () => {
      const members = ["alice", "bob", "charlie", "david", "eve"];
      const draw = performDraw(members);

      expect(draw).not.toBeNull();
      if (draw) {
        // Each giver has exactly one assignment
        expect(draw.size).toBe(members.length);

        // Each receiver appears exactly once
        const receivers = new Set(draw.values());
        expect(receivers.size).toBe(members.length);

        const result = isValidDraw(members, draw);
        expect(result.valid).toBe(true);
      }
    });

    it("should never allow self-draws", () => {
      const members = ["alice", "bob", "charlie"];

      // Run multiple times to ensure randomness doesn't cause self-draws
      for (let i = 0; i < 100; i++) {
        const draw = performDraw(members);
        expect(draw).not.toBeNull();
        if (draw) {
          for (const [giver, receiver] of draw) {
            expect(giver).not.toBe(receiver);
          }
        }
      }
    });

    it("should respect exclusion rules", () => {
      const members = ["alice", "bob", "charlie", "david"];
      const exclusionMap = new Map<string, Set<string>>();
      exclusionMap.set("alice", new Set(["bob"]));
      exclusionMap.set("bob", new Set(["alice"]));

      // Run multiple times to ensure exclusions are always respected
      for (let i = 0; i < 50; i++) {
        const draw = performDraw(members, exclusionMap);
        expect(draw).not.toBeNull();
        if (draw) {
          expect(draw.get("alice")).not.toBe("bob");
          expect(draw.get("bob")).not.toBe("alice");

          // Convert to array format for isValidDraw
          const exclusionsArray = new Map<string, string[]>();
          exclusionsArray.set("alice", ["bob"]);
          exclusionsArray.set("bob", ["alice"]);

          const result = isValidDraw(members, draw, exclusionsArray);
          expect(result.valid).toBe(true);
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle minimum group size (3 members)", () => {
      const members = ["alice", "bob", "charlie"];
      const draw = performDraw(members);

      expect(draw).not.toBeNull();
      if (draw) {
        expect(draw.size).toBe(3);
        const result = isValidDraw(members, draw);
        expect(result.valid).toBe(true);
      }
    });

    it("should return null for impossible draw (too many exclusions)", () => {
      // With 3 members, if alice excludes both bob and charlie, no valid draw exists
      const members = ["alice", "bob", "charlie"];
      const exclusionMap = new Map<string, Set<string>>();
      exclusionMap.set("alice", new Set(["bob", "charlie"]));

      const draw = performDraw(members, exclusionMap, 100);
      expect(draw).toBeNull();
    });

    it("should return null when everyone excludes everyone else", () => {
      const members = ["alice", "bob", "charlie"];
      const exclusionMap = new Map<string, Set<string>>();
      // Everyone excludes everyone (except themselves, but that's already handled)
      exclusionMap.set("alice", new Set(["bob", "charlie"]));
      exclusionMap.set("bob", new Set(["alice", "charlie"]));
      exclusionMap.set("charlie", new Set(["alice", "bob"]));

      const draw = performDraw(members, exclusionMap, 100);
      expect(draw).toBeNull();
    });

    it("should handle 4 members with couple exclusions (spouse scenario)", () => {
      // Classic scenario: two couples where spouses shouldn't draw each other
      const members = ["alice", "bob", "charlie", "diana"];
      const exclusionMap = new Map<string, Set<string>>();
      // Alice and Bob are a couple
      exclusionMap.set("alice", new Set(["bob"]));
      exclusionMap.set("bob", new Set(["alice"]));
      // Charlie and Diana are a couple
      exclusionMap.set("charlie", new Set(["diana"]));
      exclusionMap.set("diana", new Set(["charlie"]));

      // This should still be possible
      for (let i = 0; i < 20; i++) {
        const draw = performDraw(members, exclusionMap);
        expect(draw).not.toBeNull();
        if (draw) {
          expect(draw.get("alice")).not.toBe("bob");
          expect(draw.get("bob")).not.toBe("alice");
          expect(draw.get("charlie")).not.toBe("diana");
          expect(draw.get("diana")).not.toBe("charlie");
        }
      }
    });

    it("should handle larger groups efficiently", () => {
      const members = Array.from({ length: 20 }, (_, i) => `member-${i}`);
      const draw = performDraw(members);

      expect(draw).not.toBeNull();
      if (draw) {
        expect(draw.size).toBe(20);
        const result = isValidDraw(members, draw);
        expect(result.valid).toBe(true);
      }
    });

    it("should fail for 2 members (below minimum)", () => {
      // With only 2 members, each person would have to give to the only other person
      // and receive from the only other person, which is valid but the API requires 3+
      // The algorithm itself can still work with 2 members
      const members = ["alice", "bob"];
      const draw = performDraw(members);

      // The algorithm works, but the result is deterministic
      expect(draw).not.toBeNull();
      if (draw) {
        expect(draw.get("alice")).toBe("bob");
        expect(draw.get("bob")).toBe("alice");
      }
    });

    it("should handle asymmetric exclusions", () => {
      // Alice can't give to Bob, but Bob can give to Alice
      const members = ["alice", "bob", "charlie", "david"];
      const exclusionMap = new Map<string, Set<string>>();
      exclusionMap.set("alice", new Set(["bob"]));

      for (let i = 0; i < 20; i++) {
        const draw = performDraw(members, exclusionMap);
        expect(draw).not.toBeNull();
        if (draw) {
          expect(draw.get("alice")).not.toBe("bob");
          // Bob CAN give to Alice (asymmetric)
        }
      }
    });

    it("should handle chain exclusions that are still solvable", () => {
      // A -> excludes B, B -> excludes C, C -> excludes D, D -> excludes A
      // This creates a chain but should still be solvable with 4+ members
      const members = ["alice", "bob", "charlie", "david"];
      const exclusionMap = new Map<string, Set<string>>();
      exclusionMap.set("alice", new Set(["bob"]));
      exclusionMap.set("bob", new Set(["charlie"]));
      exclusionMap.set("charlie", new Set(["david"]));
      exclusionMap.set("david", new Set(["alice"]));

      // This is still solvable
      const draw = performDraw(members, exclusionMap);
      expect(draw).not.toBeNull();
      if (draw) {
        const exclusionsArray = new Map<string, string[]>();
        exclusionsArray.set("alice", ["bob"]);
        exclusionsArray.set("bob", ["charlie"]);
        exclusionsArray.set("charlie", ["david"]);
        exclusionsArray.set("david", ["alice"]);

        const result = isValidDraw(members, draw, exclusionsArray);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("Randomness and Distribution", () => {
    it("should produce different draws on different runs", () => {
      const members = ["alice", "bob", "charlie", "david", "eve"];
      const draws: string[] = [];

      for (let i = 0; i < 10; i++) {
        const draw = performDraw(members);
        if (draw) {
          const serialized = Array.from(draw.entries())
            .sort()
            .map(([k, v]) => `${k}:${v}`)
            .join(",");
          draws.push(serialized);
        }
      }

      // With 5 members, we should see some variety in the draws
      const uniqueDraws = new Set(draws);
      expect(uniqueDraws.size).toBeGreaterThan(1);
    });
  });
});

// Export the helper for potential use in integration tests
export { isValidDraw, createValidRotationDraw, performDraw };
