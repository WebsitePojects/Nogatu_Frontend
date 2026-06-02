import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default;

export const ROOT = path.resolve("src");
const FILE_EXTENSIONS = new Set([".jsx", ".tsx"]);

export async function collectFiles(dir = ROOT) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
      continue;
    }

    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

export function parseSource(source) {
  return parse(source, {
    sourceType: "module",
    plugins: ["jsx"],
    errorRecovery: false,
  });
}

export function getLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function splitToken(token) {
  const parts = token.split(":");
  const utility = parts.pop() ?? "";
  const variants = parts.join(":");
  return { variants, utility };
}

function mergeAxisShorthand(tokens, axisA, axisB, replacementPrefix) {
  const parsed = tokens.map((token) => ({ token, ...splitToken(token) }));
  const groups = new Map();

  parsed.forEach((entry, index) => {
    const firstMatch = entry.utility.match(new RegExp(`^${axisA}-(.+)$`));
    const secondMatch = entry.utility.match(new RegExp(`^${axisB}-(.+)$`));
    const match = firstMatch ?? secondMatch;

    if (!match) {
      return;
    }

    const key = `${entry.variants}|${match[1]}`;
    const group = groups.get(key) ?? { first: null, second: null };

    if (firstMatch && group.first === null) {
      group.first = index;
    }

    if (secondMatch && group.second === null) {
      group.second = index;
    }

    groups.set(key, group);
  });

  const nextTokens = [...tokens];
  const removals = new Set();

  for (const [key, group] of groups) {
    if (group.first === null || group.second === null) {
      continue;
    }

    const [variants, value] = key.split("|");
    const replacement = `${variants ? `${variants}:` : ""}${replacementPrefix}-${value}`;
    const replacementIndex = Math.min(group.first, group.second);
    const removalIndex = Math.max(group.first, group.second);

    nextTokens[replacementIndex] = replacement;
    removals.add(removalIndex);
  }

  return nextTokens.filter((_, index) => !removals.has(index));
}

export function transformClassTokens(classText) {
  const tokens = classText.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return classText;
  }

  const sizeMerged = mergeAxisShorthand(tokens, "w", "h", "size");
  const paddingMerged = mergeAxisShorthand(sizeMerged, "px", "py", "p");
  return paddingMerged.join(" ");
}

function getClassAttributeText(attribute) {
  if (!attribute || attribute.type !== "JSXAttribute" || attribute.name?.name !== "className") {
    return null;
  }

  if (!attribute.value) {
    return null;
  }

  if (attribute.value.type === "StringLiteral") {
    return [
      {
        start: attribute.value.start + 1,
        end: attribute.value.end - 1,
        value: attribute.value.value,
      },
    ];
  }

  if (
    attribute.value.type === "JSXExpressionContainer" &&
    attribute.value.expression.type === "TemplateLiteral"
  ) {
    return attribute.value.expression.quasis.map((quasi) => ({
      start: quasi.start + 1,
      end: quasi.end - 1,
      value: quasi.value.raw,
    }));
  }

  return null;
}

function hasJsxAttribute(node, attributeName) {
  return node.attributes.some(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name?.type === "JSXIdentifier" &&
      attribute.name.name === attributeName,
  );
}

function hasAncestorForm(path) {
  return Boolean(
    path.findParent((parentPath) => {
      if (parentPath.node.type !== "JSXElement") {
        return false;
      }

      const opening = parentPath.node.openingElement;
      return opening.name?.type === "JSXIdentifier" && opening.name.name === "form";
    }),
  );
}

export function inspectSource(source, filename) {
  const ast = parseSource(source);
  const findings = {
    buttonHasType: [],
    redundantSizeAxes: [],
    redundantPaddingAxes: [],
  };

  traverse(ast, {
    JSXOpeningElement(path) {
      const { node } = path;

      if (node.name?.type === "JSXIdentifier" && node.name.name === "button" && !hasJsxAttribute(node, "type")) {
        findings.buttonHasType.push({
          file: filename,
          line: getLineNumber(source, node.start ?? 0),
          snippet: source.slice(node.start, node.end).replace(/\s+/g, " ").trim(),
          insideForm: hasAncestorForm(path),
          hasOnClick: hasJsxAttribute(node, "onClick"),
        });
      }

      const classAttribute = node.attributes.find(
        (attribute) =>
          attribute.type === "JSXAttribute" &&
          attribute.name?.type === "JSXIdentifier" &&
          attribute.name.name === "className",
      );

      const ranges = getClassAttributeText(classAttribute);
      if (!ranges) {
        return;
      }

      for (const range of ranges) {
        const transformed = transformClassTokens(range.value);

        if (transformed === range.value) {
          continue;
        }

        const originalTokens = range.value.split(/\s+/).filter(Boolean);
        const nextTokens = transformed.split(/\s+/).filter(Boolean);

        const hasSizeChange =
          originalTokens.some((token) => /(^|:)w-/.test(token) || /(^|:)h-/.test(token)) &&
          nextTokens.some((token) => /(^|:)size-/.test(token));

        const hasPaddingChange =
          originalTokens.some((token) => /(^|:)px-/.test(token) || /(^|:)py-/.test(token)) &&
          nextTokens.some((token) => /(^|:)p-/.test(token));

        if (hasSizeChange) {
          findings.redundantSizeAxes.push({
            file: filename,
            line: getLineNumber(source, range.start),
            snippet: range.value.trim(),
          });
        }

        if (hasPaddingChange) {
          findings.redundantPaddingAxes.push({
            file: filename,
            line: getLineNumber(source, range.start),
            snippet: range.value.trim(),
          });
        }
      }
    },
  });

  return findings;
}

function applyEdits(source, edits) {
  const sorted = [...edits].sort((left, right) => right.start - left.start);
  let nextSource = source;

  for (const edit of sorted) {
    nextSource = `${nextSource.slice(0, edit.start)}${edit.value}${nextSource.slice(edit.end)}`;
  }

  return nextSource;
}

export async function rewriteFile(file, editBuilder) {
  const source = await readFile(file, "utf8");
  const ast = parseSource(source);
  const edits = [];

  editBuilder({ ast, source, edits });

  if (edits.length === 0) {
    return false;
  }

  const nextSource = applyEdits(source, edits);
  if (nextSource === source) {
    return false;
  }

  await writeFile(file, nextSource, "utf8");
  return true;
}

export function traverseAst(ast, visitor) {
  traverse(ast, visitor);
}

export function getClassRanges(attribute) {
  return getClassAttributeText(attribute);
}

export function jsxHasAttribute(node, attributeName) {
  return hasJsxAttribute(node, attributeName);
}

export function jsxIsInsideForm(path) {
  return hasAncestorForm(path);
}
