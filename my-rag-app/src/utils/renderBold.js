import { createElement } from "react";

export function renderBold(text) {
  return text.split("\n").map((line, lineIndex) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, i) =>
      i % 2 === 1 ? createElement("strong", { key: i, style: { fontWeight: 700 } }, part) : part
    );
    return createElement(
      "div",
      { key: lineIndex, style: { marginBottom: line.trim() === "" ? 0 : 10 } },
      rendered
    );
  });
}
