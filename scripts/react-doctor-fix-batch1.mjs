import path from "node:path";
import {
  collectFiles,
  getClassRanges,
  jsxHasAttribute,
  jsxIsInsideForm,
  rewriteFile,
  transformClassTokens,
  traverseAst,
} from "./react-doctor-shared.mjs";

const files = await collectFiles();
let changedFiles = 0;

for (const file of files) {
  const updated = await rewriteFile(file, ({ ast, edits, source }) => {
    traverseAst(ast, {
      JSXOpeningElement(pathRef) {
        const { node } = pathRef;

        if (node.name?.type === "JSXIdentifier" && node.name.name === "button" && !jsxHasAttribute(node, "type")) {
          const typeValue = jsxIsInsideForm(pathRef) && !jsxHasAttribute(node, "onClick") ? "submit" : "button";
          const insertAt = node.selfClosing ? (node.end ?? 0) - 2 : (node.end ?? 0) - 1;
          edits.push({
            start: insertAt,
            end: insertAt,
            value: ` type="${typeValue}"`,
          });
        }

        const classAttribute = node.attributes.find(
          (attribute) =>
            attribute.type === "JSXAttribute" &&
            attribute.name?.type === "JSXIdentifier" &&
            attribute.name.name === "className",
        );

        const ranges = getClassRanges(classAttribute);
        if (!ranges) {
          return;
        }

        for (const range of ranges) {
          const transformed = transformClassTokens(range.value);

          if (transformed === range.value) {
            continue;
          }

          edits.push({
            start: range.start,
            end: range.end,
            value: transformed,
          });
        }
      },
    });
  });

  if (updated) {
    changedFiles += 1;
    console.log(`updated ${path.relative(process.cwd(), file).replaceAll("\\", "/")}`);
  }
}

console.log(`changed files: ${changedFiles}`);
