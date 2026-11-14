import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Header } from "../src/components/Header";

test("workspace navigation exposes the active view and research tools", () => {
  const noop = () => {};
  const html = renderToStaticMarkup(<Header corpusCount={12} selectedCount={2} activeView="workspace" activeMainView="explorer" onSelectView={noop} onReset={noop} onOpenBrief={noop} onOpenCompare={noop} onOpenCoverage={noop} onOpenSources={noop} onOpenAssistant={noop} onOpenWhiteboard={noop} />);
  assert.match(html, /aria-label="Workspace navigation"/);
  assert.match(html, /aria-current="page"[^>]*>.*?Explore/);
  assert.match(html, /AI Assistant/);
  assert.match(html, /Evidence brief/);
  assert.match(html, /aria-label="Collapse navigation"/);
});
