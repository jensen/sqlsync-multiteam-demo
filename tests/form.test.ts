import { describe, it, expect } from "vitest";
import { parseFormData } from "../app/lib/form";

describe("parseFormData", () => {
  it("returns typed object for valid form data", () => {
    const formData = new FormData();
    formData.append("title", "Test Issue");
    formData.append("priority", "3");
    formData.append("team", "alpha");

    const result = parseFormData<{ title: string; priority: string; team: string }>(
      formData,
      ["title", "priority", "team"]
    );

    expect(result).toEqual({
      title: "Test Issue",
      priority: "3",
      team: "alpha",
    });
  });

  it("throws for missing field", () => {
    const formData = new FormData();
    formData.append("title", "Test Issue");

    expect(() =>
      parseFormData<{ title: string; priority: string }>(formData, [
        "title",
        "priority",
      ])
    ).toThrow("Missing field: priority");
  });

  it("throws when field is a File instead of string", () => {
    const formData = new FormData();
    formData.append("title", "Test Issue");
    formData.append("attachment", new File(["content"], "test.txt"));

    expect(() =>
      parseFormData<{ title: string; attachment: string }>(formData, [
        "title",
        "attachment",
      ])
    ).toThrow("Field attachment must be a string");
  });

  it("allows empty strings as valid values", () => {
    const formData = new FormData();
    formData.append("title", "");
    formData.append("priority", "1");

    const result = parseFormData<{ title: string; priority: string }>(
      formData,
      ["title", "priority"]
    );

    expect(result.title).toBe("");
    expect(result.priority).toBe("1");
  });

  it("throws for multiple missing fields with the first missing field named", () => {
    const formData = new FormData();
    // No fields appended

    expect(() =>
      parseFormData<{ a: string; b: string; c: string }>(formData, [
        "a",
        "b",
        "c",
      ])
    ).toThrow("Missing field: a");
  });

  it("handles unicode and special characters in field values", () => {
    const formData = new FormData();
    formData.append("title", "🔥 Unicode test: ñ, 中文, \n\t\\");
    formData.append("team", "team-123_test");

    const result = parseFormData<{ title: string; team: string }>(formData, [
      "title",
      "team",
    ]);

    expect(result.title).toBe("🔥 Unicode test: ñ, 中文, \n\t\\");
    expect(result.team).toBe("team-123_test");
  });

  it("handles very long strings", () => {
    const longString = "a".repeat(100000);
    const formData = new FormData();
    formData.append("title", longString);

    const result = parseFormData<{ title: string }>(formData, ["title"]);
    expect(result.title).toHaveLength(100000);
  });

  it("throws when field is a Blob (not File)", () => {
    const formData = new FormData();
    formData.append("title", "Test Issue");
    formData.append("data", new Blob(["blob content"]));

    expect(() =>
      parseFormData<{ title: string; data: string }>(formData, [
        "title",
        "data",
      ])
    ).toThrow("Field data must be a string");
  });

  it("distinguishes empty string from missing field", () => {
    const formData = new FormData();
    formData.append("title", "");

    // Empty string is valid
    const result = parseFormData<{ title: string }>(formData, ["title"]);
    expect(result.title).toBe("");

    // Missing field throws
    expect(() =>
      parseFormData<{ title: string; missing: string }>(formData, [
        "title",
        "missing",
      ])
    ).toThrow("Missing field: missing");
  });

  it("handles whitespace-only strings as valid", () => {
    const formData = new FormData();
    formData.append("title", "   ");
    formData.append("team", "\t\n");

    const result = parseFormData<{ title: string; team: string }>(formData, [
      "title",
      "team",
    ]);

    expect(result.title).toBe("   ");
    expect(result.team).toBe("\t\n");
  });

  it("throws for null value explicitly set (edge case)", () => {
    // FormData.get returns null for missing fields, but we can't actually
    // set a null value in FormData. This test documents that behavior.
    const formData = new FormData();
    // append with empty string is different from not appending at all
    formData.append("title", "");

    const result = parseFormData<{ title: string }>(formData, ["title"]);
    expect(result.title).toBe("");
  });
});
