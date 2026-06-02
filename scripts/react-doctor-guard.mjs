import path from "node:path";
import { collectFiles, inspectSource } from "./react-doctor-shared.mjs";
import { readFile } from "node:fs/promises";

function printFindings(title, findings) {
  console.log(`${title}: ${findings.length}`);

  for (const finding of findings) {
    console.log(`- ${finding.file}:${finding.line} ${finding.snippet}`);
  }
}

const files = await collectFiles();
const totals = {
  buttonHasType: [],
  redundantSizeAxes: [],
  redundantPaddingAxes: [],
};

for (const file of files) {
  const source = await readFile(file, "utf8");
  const relativeFile = path.relative(process.cwd(), file).replaceAll("\\", "/");
  const findings = inspectSource(source, relativeFile);

  totals.buttonHasType.push(...findings.buttonHasType);
  totals.redundantSizeAxes.push(...findings.redundantSizeAxes);
  totals.redundantPaddingAxes.push(...findings.redundantPaddingAxes);
}

printFindings("button-has-type", totals.buttonHasType);
printFindings("design-no-redundant-size-axes", totals.redundantSizeAxes);
printFindings("design-no-redundant-padding-axes", totals.redundantPaddingAxes);

const total =
  totals.buttonHasType.length +
  totals.redundantSizeAxes.length +
  totals.redundantPaddingAxes.length;

if (total > 0) {
  process.exitCode = 1;
}
