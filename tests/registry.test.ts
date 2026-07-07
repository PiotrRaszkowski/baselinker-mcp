import { describe, expect, it } from "vitest";
import { allCategories } from "../src/categories/index.js";

const FILE_METHODS = [
  "getLabel",
  "getProtocol",
  "getCourierDocument",
  "getInvoiceFile",
  "getInventoryDocumentFile",
  "getInventoryFulfillmentDeliveryLabels",
];

const allMethods = allCategories.flatMap((category) => category.methods);

describe("category registry", () => {
  it("methodNamesWhenCollectedAcrossCategoriesThenAreUnique", () => {
    const names = allMethods.map((method) => method.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("methodsWhenInspectedThenAllAreReadOnly", () => {
    const writeMethods = allMethods.filter((method) => method.mode !== "read");

    expect(writeMethods).toEqual([]);
  });

  it("methodsWhenInspectedThenAllHaveNonEmptyDescriptions", () => {
    const withoutDescription = allMethods.filter(
      (method) => method.description.trim().length === 0,
    );

    expect(withoutDescription).toEqual([]);
  });

  it("methodNamesWhenInspectedThenAllAreGetters", () => {
    const nonGetters = allMethods.filter((method) => !method.name.startsWith("get"));

    expect(nonGetters).toEqual([]);
  });

  it("fileMethodsWhenInspectedThenAllHaveTransformResult", () => {
    const fileMethodDefs = allMethods.filter((method) => FILE_METHODS.includes(method.name));

    expect(fileMethodDefs).toHaveLength(FILE_METHODS.length);
    for (const method of fileMethodDefs) {
      expect(method.transformResult, method.name).toBeDefined();
    }
  });

  it("toolNamesWhenCollectedThenAreUniqueAndPrefixed", () => {
    const toolNames = allCategories.map((category) => category.toolName);

    expect(new Set(toolNames).size).toBe(toolNames.length);
    for (const toolName of toolNames) {
      expect(toolName).toMatch(/^baselinker_[a-z_]+$/);
    }
  });

  it("categoriesWhenCountedThenCoverAllExpectedMethods", () => {
    expect(allCategories).toHaveLength(10);
    expect(allMethods).toHaveLength(87);
  });
});
