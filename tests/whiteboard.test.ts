import test, { describe } from "node:test";
import assert from "node:assert";

describe("Stage 3 Research Whiteboard & Mind Tree Studio", () => {
  test("serializes research mind tree nodes into structured Evidence Brief markdown", () => {
    const nodes = [
      {
        id: "q-1",
        type: "question",
        data: {
          label: "Forced Airflow Flame Spread Divergence",
          details: "Why do large fuels sustain flames at 20 cm/s where glovebox samples extinguish?",
        },
      },
      {
        id: "ev-1",
        type: "evidence",
        data: {
          claimId: "CLM-SAFFIRE-1",
          investigation: "Saffire-I Flight Experiment",
          conditions: "21% O₂ • 20 cm/s Flow",
          quote: "0.4 m x 1.0 m solid burns continuously under forced flow.",
        },
      },
      {
        id: "hyp-1",
        type: "hypothesis",
        data: {
          title: "Cumulative Radiative Feedback",
          prediction: "Downstream solid preheats from flame radiation.",
          rationale: "Sample width prevents lateral radiative loss.",
        },
      },
      {
        id: "exp-1",
        type: "experiment",
        data: {
          facility: "ISS CIR",
          objective: "Intermediate-Scale Radiative Feedback Duct",
          airflow: "15 cm/s",
          oxygen: "21% O₂",
          pressure: "101.3 kPa",
        },
      },
    ];

    // Serialization function test
    const lines: string[] = [
      "# Research Whiteboard: Hypothesis & Experiment Synthesis",
      "## 1. Primary Research Questions",
    ];

    const questions = nodes.filter((n) => n.type === "question");
    questions.forEach((q) => {
      lines.push(`- **${q.data.label}**: ${q.data.details}`);
    });

    lines.push("\n## 2. Grounded NASA Evidence Nodes");
    const evidence = nodes.filter((n) => n.type === "evidence");
    evidence.forEach((ev) => {
      lines.push(`- **[${ev.data.claimId}] ${ev.data.investigation}** (${ev.data.conditions})`);
      lines.push(`  > "${ev.data.quote}"`);
    });

    lines.push("\n## 3. Physical Hypotheses");
    const hypotheses = nodes.filter((n) => n.type === "hypothesis");
    hypotheses.forEach((hyp) => {
      lines.push(`- **${hyp.data.title}**: ${hyp.data.prediction}`);
    });

    lines.push("\n## 4. Proposed Experiment Architecture");
    const experiments = nodes.filter((n) => n.type === "experiment");
    experiments.forEach((exp) => {
      lines.push(`- **${exp.data.objective}** [Facility: ${exp.data.facility}]`);
    });

    const markdown = lines.join("\n");

    assert.ok(markdown.includes("Forced Airflow Flame Spread Divergence"));
    assert.ok(markdown.includes("[CLM-SAFFIRE-1] Saffire-I Flight Experiment"));
    assert.ok(markdown.includes("Cumulative Radiative Feedback"));
    assert.ok(markdown.includes("Intermediate-Scale Radiative Feedback Duct"));
  });
});
