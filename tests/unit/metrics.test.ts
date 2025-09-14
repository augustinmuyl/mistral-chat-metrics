import { bytesToKB } from "../../src/lib/metrics";

it("converts bytes to KB with two decimals", () => {
  expect(bytesToKB(1024)).toBe(1);
});
