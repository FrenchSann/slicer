import { describe, it, expect } from "vitest";
import {
  checkoutSchema,
  contactSchema,
  newsletterSchema,
} from "../src/lib/validation";
const item = { id: "4e7b1865-5d0c-4c39-8943-d8b25eeed8b2", quantity: 1 };
describe("Checkout trust boundary", () => {
  it("accepts EU carts", () =>
    expect(
      checkoutSchema.safeParse({ items: [item], country: "FR" }).success,
    ).toBe(true));
  it.each([0, -1, 1.5, 11, Infinity])(
    "rejects invalid quantity %s",
    (quantity) =>
      expect(
        checkoutSchema.safeParse({
          items: [{ ...item, quantity }],
          country: "FR",
        }).success,
      ).toBe(false),
  );
  it("rejects client prices", () =>
    expect(
      checkoutSchema.safeParse({
        items: [{ ...item, price: 1 }],
        country: "FR",
      }).success,
    ).toBe(false));
  it("rejects outside EU", () =>
    expect(
      checkoutSchema.safeParse({ items: [item], country: "US" }).success,
    ).toBe(false));
  it("rejects empty carts", () =>
    expect(checkoutSchema.safeParse({ items: [], country: "FR" }).success).toBe(
      false,
    ));
});
describe("Public forms", () => {
  it("requires separate newsletter consent", () =>
    expect(
      newsletterSchema.safeParse({ email: "person@example.com" }).success,
    ).toBe(false));
  it("rejects honeypot", () =>
    expect(
      newsletterSchema.safeParse({
        email: "person@example.com",
        consent: "on",
        website: "spam",
      }).success,
    ).toBe(false));
  it("accepts explicit consent", () =>
    expect(
      newsletterSchema.safeParse({
        email: "person@example.com",
        consent: "on",
        website: "",
      }).success,
    ).toBe(true));
  it("rejects empty messages", () =>
    expect(
      contactSchema.safeParse({ email: "person@example.com", message: "" })
        .success,
    ).toBe(false));
});
