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
});
