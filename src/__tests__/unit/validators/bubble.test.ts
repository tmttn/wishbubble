import { describe, it, expect } from "vitest";
import {
  createBubbleSchema,
  updateBubbleSchema,
  inviteMembersSchema,
  occasionTypes,
} from "@/lib/validators/bubble";

describe("Bubble Validators", () => {
  describe("createBubbleSchema", () => {
    it("should validate minimal bubble data", () => {
      const validData = {
        name: "Christmas 2024",
        occasionType: "CHRISTMAS",
      };

      const result = createBubbleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("EUR");
        expect(result.data.isSecretSanta).toBe(false);
        expect(result.data.maxMembers).toBe(10);
        expect(result.data.allowMemberWishlists).toBe(true);
      }
    });

    it("should validate complete bubble data", () => {
      const validData = {
        name: "Family Secret Santa",
        description: "Our annual family gift exchange",
        occasionType: "CHRISTMAS",
        eventDate: "2024-12-25",
        budgetMin: 20,
        budgetMax: 50,
        currency: "USD",
        isSecretSanta: true,
        maxMembers: 25,
        allowMemberWishlists: false,
      };

      const result = createBubbleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventDate).toBeInstanceOf(Date);
        expect(result.data.budgetMin).toBe(20);
        expect(result.data.budgetMax).toBe(50);
      }
    });

    it("should reject name shorter than 2 characters", () => {
      const invalidData = {
        name: "X",
        occasionType: "CHRISTMAS",
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("name");
      }
    });

    it("should reject name longer than 100 characters", () => {
      const invalidData = {
        name: "X".repeat(101),
        occasionType: "CHRISTMAS",
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid occasion type", () => {
      const invalidData = {
        name: "Test Bubble",
        occasionType: "INVALID_OCCASION",
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("occasionType");
      }
    });

    it("should accept all valid occasion types", () => {
      occasionTypes.forEach((occasionType) => {
        const validData = {
          name: `${occasionType} Event`,
          occasionType,
        };

        const result = createBubbleSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it("should transform string date to Date object", () => {
      const validData = {
        name: "Birthday Party",
        occasionType: "BIRTHDAY",
        eventDate: "2024-06-15",
      };

      const result = createBubbleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventDate).toBeInstanceOf(Date);
      }
    });

    it("should accept Date object for eventDate", () => {
      const validData = {
        name: "Birthday Party",
        occasionType: "BIRTHDAY",
        eventDate: new Date("2024-06-15"),
      };

      const result = createBubbleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventDate).toBeInstanceOf(Date);
      }
    });

    it("should handle empty string eventDate as undefined", () => {
      const validData = {
        name: "Birthday Party",
        occasionType: "BIRTHDAY",
        eventDate: "",
      };

      const result = createBubbleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventDate).toBeUndefined();
      }
    });

    it("should reject negative budget values", () => {
      const invalidData = {
        name: "Test Bubble",
        occasionType: "CHRISTMAS",
        budgetMin: -10,
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject maxMembers less than 2", () => {
      const invalidData = {
        name: "Test Bubble",
        occasionType: "CHRISTMAS",
        maxMembers: 1,
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject maxMembers greater than 100", () => {
      const invalidData = {
        name: "Test Bubble",
        occasionType: "CHRISTMAS",
        maxMembers: 101,
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should coerce string numbers for budget values", () => {
      const validData = {
        name: "Test Bubble",
        occasionType: "CHRISTMAS",
        budgetMin: "20" as unknown as number,
        budgetMax: "50" as unknown as number,
      };

      const result = createBubbleSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budgetMin).toBe(20);
        expect(result.data.budgetMax).toBe(50);
      }
    });

    it("should reject description longer than 500 characters", () => {
      const invalidData = {
        name: "Test Bubble",
        occasionType: "CHRISTMAS",
        description: "X".repeat(501),
      };

      const result = createBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateBubbleSchema", () => {
    it("should allow partial updates", () => {
      const partialData = {
        name: "Updated Name",
      };

      const result = updateBubbleSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("should allow empty object (no updates)", () => {
      const result = updateBubbleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate individual fields when provided", () => {
      const invalidData = {
        name: "X", // Too short
      };

      const result = updateBubbleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("inviteMembersSchema", () => {
    it("should validate single email", () => {
      const validData = {
        emails: ["test@example.com"],
      };

      const result = inviteMembersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate multiple emails", () => {
      const validData = {
        emails: ["test1@example.com", "test2@example.com", "test3@example.com"],
      };

      const result = inviteMembersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty email array", () => {
      const invalidData = {
        emails: [],
      };

      const result = inviteMembersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email in array", () => {
      const invalidData = {
        emails: ["valid@example.com", "not-an-email"],
      };

      const result = inviteMembersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing emails field", () => {
      const result = inviteMembersSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
