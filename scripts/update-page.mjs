import fs from 'node:fs';

const filePath = 'src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update viewMode state type
content = content.replace(
  'const [viewMode, setViewMode] = useState<"dashboard" | "explorer" | "split">("dashboard");',
  'const [viewMode, setViewMode] = useState<"dashboard" | "explorer" | "split" | "assistant">("dashboard");'
);

// 2. Update Header onOpenAssistant & onSelectView
const headerSelectOldCRLF = `        activeMainView={viewMode}\r
        onSelectView={(view) => {\r
          if (view === "assistant") {\r
            setIsAssistantOpen(true);\r
          } else {\r
            setViewMode(view);\r
          }\r
        }}`;
const headerSelectOldLF = `        activeMainView={viewMode}\n        onSelectView={(view) => {\n          if (view === "assistant") {\n            setIsAssistantOpen(true);\n          } else {\n            setViewMode(view);\n          }\n        }}`;

const headerSelectNewCRLF = `        activeMainView={viewMode}\r
        onOpenAssistant={() => {\r
          setViewMode("assistant");\r
          setIsAssistantOpen(false);\r
        }}\r
        onSelectView={(view) => {\r
          setViewMode(view);\r
          if (view === "assistant") setIsAssistantOpen(false);\r
        }}`;
const headerSelectNewLF = `        activeMainView={viewMode}\n        onOpenAssistant={() => {\n          setViewMode("assistant");\n          setIsAssistantOpen(false);\n        }}\n        onSelectView={(view) => {\n          setViewMode(view);\n          if (view === "assistant") setIsAssistantOpen(false);\n        }}`;

if (content.includes(headerSelectOldCRLF)) {
  content = content.replace(headerSelectOldCRLF, headerSelectNewCRLF);
} else if (content.includes(headerSelectOldLF)) {
  content = content.replace(headerSelectOldLF, headerSelectNewLF);
} else {
  // Fallback single replace
  content = content.replace(
    'onOpenAssistant={() => setIsAssistantOpen(true)}',
    'onOpenAssistant={() => { setViewMode("assistant"); setIsAssistantOpen(false); }}'
  );
  content = content.replace(
    'if (view === "assistant") {\r\n            setIsAssistantOpen(true);',
    'if (view === "assistant") {\r\n            setViewMode("assistant"); setIsAssistantOpen(false);'
  );
  content = content.replace(
    'if (view === "assistant") {\n            setIsAssistantOpen(true);',
    'if (view === "assistant") {\n            setViewMode("assistant"); setIsAssistantOpen(false);'
  );
}

// 3. Update guided step agent navigation
content = content.replace(
  'else if (step === "agent") {\r\n      setIsAssistantOpen(true);',
  'else if (step === "agent") {\r\n      setViewMode("assistant"); setIsAssistantOpen(false);'
);
content = content.replace(
  'else if (step === "agent") {\n      setIsAssistantOpen(true);',
  'else if (step === "agent") {\n      setViewMode("assistant"); setIsAssistantOpen(false);'
);

// 4. Update Header bar display condition (do not show explorer title bar when in assistant mode)
content = content.replace(
  '{viewMode !== "dashboard" && (',
  '{viewMode !== "dashboard" && viewMode !== "assistant" && ('
);

// 5. In ExecutiveAnalyticsDashboard:
content = content.replace(
  'onOpenAssistant={(prompt) => {\r\n              setAssistantInitialPrompt(prompt);\r\n              setIsAssistantOpen(true);\r\n            }}',
  'onOpenAssistant={(prompt) => {\r\n              setAssistantInitialPrompt(prompt);\r\n              setViewMode("assistant");\r\n              setIsAssistantOpen(false);\r\n            }}'
);
content = content.replace(
  'onOpenAssistant={(prompt) => {\n              setAssistantInitialPrompt(prompt);\n              setIsAssistantOpen(true);\n            }}',
  'onOpenAssistant={(prompt) => {\n              setAssistantInitialPrompt(prompt);\n              setViewMode("assistant");\n              setIsAssistantOpen(false);\n            }}'
);

// 6. In CoverageMapModal:
content = content.replace(
  'onAskAI={(prompt) => {\r\n          setAssistantInitialPrompt(prompt);\r\n          setIsAssistantOpen(true);\r\n        }}',
  'onAskAI={(prompt) => {\r\n          setAssistantInitialPrompt(prompt);\r\n          setViewMode("assistant");\r\n          setIsAssistantOpen(false);\r\n        }}'
);
content = content.replace(
  'onAskAI={(prompt) => {\n          setAssistantInitialPrompt(prompt);\n          setIsAssistantOpen(true);\n        }}',
  'onAskAI={(prompt) => {\n          setAssistantInitialPrompt(prompt);\n          setViewMode("assistant");\n          setIsAssistantOpen(false);\n        }}'
);

// 7. In ResearchExplorerGrid:
content = content.replace(
  'onAskAI={(prompt) => {\r\n              setAssistantInitialPrompt(prompt);\r\n              setIsAssistantOpen(true);\r\n            }}',
  'onAskAI={(prompt) => {\r\n              setAssistantInitialPrompt(prompt);\r\n              setViewMode("assistant");\r\n              setIsAssistantOpen(false);\r\n            }}'
);
content = content.replace(
  'onAskAI={(prompt) => {\n              setAssistantInitialPrompt(prompt);\n              setIsAssistantOpen(true);\n            }}',
  'onAskAI={(prompt) => {\n              setAssistantInitialPrompt(prompt);\n              setViewMode("assistant");\n              setIsAssistantOpen(false);\n            }}'
);

// 8. In CombustionSimulatorModal:
content = content.replace(
  'onAskAI={(prompt) => {\r\n          setIsSimulatorOpen(false);\r\n          setAssistantInitialPrompt(prompt);\r\n          setIsAssistantOpen(true);\r\n        }}',
  'onAskAI={(prompt) => {\r\n          setIsSimulatorOpen(false);\r\n          setAssistantInitialPrompt(prompt);\r\n          setViewMode("assistant");\r\n          setIsAssistantOpen(false);\r\n        }}'
);
content = content.replace(
  'onAskAI={(prompt) => {\n          setIsSimulatorOpen(false);\n          setAssistantInitialPrompt(prompt);\n          setIsAssistantOpen(true);\n        }}',
  'onAskAI={(prompt) => {\n          setIsSimulatorOpen(false);\n          setAssistantInitialPrompt(prompt);\n          setViewMode("assistant");\n          setIsAssistantOpen(false);\n        }}'
);

// 9. Add viewMode === "assistant" view in main
const dashboardCheckCRLF = '{/* Content View: Dashboard vs Research Explorer vs Split Workspace */}\r\n        {viewMode === "dashboard" ? (';
const dashboardCheckLF = '{/* Content View: Dashboard vs Research Explorer vs Split Workspace */}\n        {viewMode === "dashboard" ? (';

const assistantViewCode = `{viewMode === "assistant" ? (
          <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-8rem)]">
            <GroundedChatDrawer
              isOpen={true}
              isFullPage={true}
              onClose={() => setViewMode("dashboard")}
              onToggleFullPage={() => {
                setViewMode("dashboard");
                setIsAssistantOpen(true);
              }}
              corpus={corpus}
              selectedRecordIds={selectedIds}
              initialPrompt={assistantInitialPrompt}
              onConsumeInitialPrompt={() => setAssistantInitialPrompt(null)}
              onInspectClaim={(recId) => {
                setActiveId(recId);
                setIsSourceModalOpen(true);
              }}
              onAddToWhiteboard={(text, citations, customTree) => {
                setWhiteboardInitialPrompt(text);
                if (customTree) setWhiteboardInitialTree(customTree);
                setIsWhiteboardOpen(true);
              }}
              onRunSimulation={(args) => {
                setSimulatorInitialConfig(args);
                setSimulatorInitialTab("physics");
                setIsSimulatorOpen(true);
              }}
              onOpenSimulator={(preset) => {
                setSimulatorInitialTab("physics");
                setIsSimulatorOpen(true);
              }}
              onOpenDiagnostics={(plateId, filterMode) => {
                if (plateId || filterMode) {
                  setSimulatorInitialDiagConfig({
                    plateId: (plateId as any) || "rtdfs",
                    filterMode: (filterMode as any) || "chemiluminescence",
                    rationale: "AI Copilot Calibrated CV Diagnostic Inspection",
                  });
                }
                setSimulatorInitialTab("diagnostics");
                setIsSimulatorOpen(true);
              }}
              onFilterExplorer={(args) => {
                let mappedMaterial: "all" | "liquid_droplets" | "pmma" | "fabrics_cellulose" | "wire_insulation" | "gaseous_fuels" | "other_solids" = "all";
                const matStr = (args.materialClasses || []).join(" ").toLowerCase();
                if (matStr.includes("fabric") || matStr.includes("cellulose") || matStr.includes("thin") || matStr.includes("sibal")) {
                  mappedMaterial = "fabrics_cellulose";
                } else if (matStr.includes("pmma") || matStr.includes("acrylic") || matStr.includes("plexiglass")) {
                  mappedMaterial = "pmma";
                } else if (matStr.includes("droplet") || matStr.includes("liquid") || matStr.includes("heptane") || matStr.includes("decane") || matStr.includes("methanol")) {
                  mappedMaterial = "liquid_droplets";
                } else if (matStr.includes("wire") || matStr.includes("insulation") || matStr.includes("kapton")) {
                  mappedMaterial = "wire_insulation";
                } else if (matStr.includes("gas") || matStr.includes("methane")) {
                  mappedMaterial = "gaseous_fuels";
                }

                let mappedGravity: "all" | "microgravity" | "partial_gravity" | "lunar" | "martian" | "terrestrial" = "all";
                const gravStr = (args.gravityRegimes || []).join(" ").toLowerCase();
                if (gravStr.includes("lunar") || gravStr.includes("0.16")) {
                  mappedGravity = "lunar";
                } else if (gravStr.includes("martian") || gravStr.includes("0.38")) {
                  mappedGravity = "martian";
                } else if (gravStr.includes("micro") || gravStr.includes("µg") || gravStr.includes("0g")) {
                  mappedGravity = "microgravity";
                } else if (gravStr.includes("partial")) {
                  mappedGravity = "partial_gravity";
                }

                setExplorerFilters({
                  searchQuery: args.searchQuery,
                  material: mappedMaterial,
                  gravity: mappedGravity,
                  oxygenRange: args.oxygenRange,
                });
                setViewMode("explorer");
              }}
              onOpenCoverageMap={() => setIsCoverageOpen(true)}
              onOpenGraph={() => setIsGraphOpen(true)}
              onOpenIngestion={() => setIsIngestionOpen(true)}
              onRunPipeline={(steps) => {
                const { next, remaining } = takeNextAction(steps);
                setPendingActions(() => remaining);
                next?.();
              }}
            />
          </div>
        ) : viewMode === "dashboard" ? (`;

if (content.includes(dashboardCheckCRLF)) {
  content = content.replace(dashboardCheckCRLF, `{/* Content View: Dashboard vs Research Explorer vs Split Workspace vs Full Page AI */}\r\n        ` + assistantViewCode.replace(/\n/g, '\r\n'));
} else if (content.includes(dashboardCheckLF)) {
  content = content.replace(dashboardCheckLF, `{/* Content View: Dashboard vs Research Explorer vs Split Workspace vs Full Page AI */}\n        ` + assistantViewCode);
} else {
  console.error('Could not find dashboard check marker in page.tsx');
  process.exit(1);
}

// 10. Update drawer version to only render when viewMode !== "assistant" and pass onToggleFullPage
const drawerMarkerCRLF = '{/* Stage 3: Grounded AI Assistant Drawer (Nemotron 30B RAG) */}\r\n      <GroundedChatDrawer\r\n        isOpen={isAssistantOpen}';
const drawerMarkerLF = '{/* Stage 3: Grounded AI Assistant Drawer (Nemotron 30B RAG) */}\n      <GroundedChatDrawer\n        isOpen={isAssistantOpen}';

const drawerReplacement = `{/* Stage 3: Grounded AI Assistant Drawer (Nemotron 30B RAG) - side drawer fallback */}\n      {viewMode !== "assistant" && (\n        <GroundedChatDrawer\n          isOpen={isAssistantOpen}\n          isFullPage={false}\n          onToggleFullPage={() => {\n            setIsAssistantOpen(false);\n            setViewMode("assistant");\n          }}`;

if (content.includes(drawerMarkerCRLF)) {
  content = content.replace(drawerMarkerCRLF, drawerReplacement.replace(/\n/g, '\r\n'));
  content = content.replace(
    'onOpenIngestion={() => setIsIngestionOpen(true)}\r\n      />',
    'onOpenIngestion={() => setIsIngestionOpen(true)}\r\n        />\r\n      )}'
  );
} else if (content.includes(drawerMarkerLF)) {
  content = content.replace(drawerMarkerLF, drawerReplacement);
  content = content.replace(
    'onOpenIngestion={() => setIsIngestionOpen(true)}\n      />',
    'onOpenIngestion={() => setIsIngestionOpen(true)}\n        />\n      )}'
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated src/app/page.tsx!');
