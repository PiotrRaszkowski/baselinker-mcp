import { describe, expect, it } from "vitest";
import { allCategories } from "../src/categories/index.js";

const WRITE_PREFIXES = ["add", "set", "delete", "update", "create", "run"];

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

  it("methodsWhenInspectedThenEachHasReadOrWriteMode", () => {
    const invalidModes = allMethods.filter(
      (method) => method.mode !== "read" && method.mode !== "write",
    );

    expect(invalidModes).toEqual([]);
  });

  it("methodsWhenInspectedThenAllHaveNonEmptyDescriptions", () => {
    const withoutDescription = allMethods.filter(
      (method) => method.description.trim().length === 0,
    );

    expect(withoutDescription).toEqual([]);
  });

  it("readMethodNamesWhenInspectedThenAllAreGetters", () => {
    const nonGetterReads = allMethods
      .filter((method) => method.mode === "read")
      .filter((method) => !method.name.startsWith("get"));

    expect(nonGetterReads).toEqual([]);
  });

  it("writeMethodNamesWhenInspectedThenAllUseMutatingPrefixes", () => {
    const nonMutatingWrites = allMethods
      .filter((method) => method.mode === "write")
      .filter((method) => !WRITE_PREFIXES.some((prefix) => method.name.startsWith(prefix)));

    expect(nonMutatingWrites).toEqual([]);
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
    const readMethods = allMethods.filter((method) => method.mode === "read");
    const writeMethods = allMethods.filter((method) => method.mode === "write");

    expect(allCategories).toHaveLength(10);
    expect(readMethods).toHaveLength(87);
    expect(writeMethods).toHaveLength(92);
    expect(allMethods).toHaveLength(179);
  });
});
