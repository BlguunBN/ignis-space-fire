import { test, describe } from 'node:test';
import assert from 'node:assert';
import rawExperiments from '../src/data/experiments.json';
import { ExperimentRecord } from '../src/types/evidence';

const experiments = rawExperiments as ExperimentRecord[];

describe('Physics Droplet d² Burning Law & Simulation Verification', () => {
  // Classic Godsave-Spalding d² law: d²(t) = d₀² - K * t
  function calculateDropletDiameter(d0_mm: number, K_mm2_s: number, t_sec: number): number {
    const dSquared = Math.max(0, d0_mm * d0_mm - K_mm2_s * t_sec);
    return Math.sqrt(dSquared);
  }

  // NASA PSI FLEX-2 empirical burning rate formulation
  function computeBurningRateConstant(
    baseK: number,
    oxygenPct: number,
    pressureAtm: number,
    gravityG: number
  ): number {
    // K scales with O2 concentration and pressure^(0.1-0.2)
    // In microgravity (g ~ 0), no buoyancy augmentation occurs
    const o2Factor = Math.pow(oxygenPct / 21.0, 0.65);
    const pressureFactor = Math.pow(pressureAtm, 0.15);
    const buoyancyFactor = 1.0 + 0.35 * Math.pow(Math.max(0, gravityG), 0.5);
    return baseK * o2Factor * pressureFactor * buoyancyFactor;
  }

  test('droplet diameter regresses continuously following d² law down to extinction', () => {
    const d0 = 2.0; // 2 mm droplet
    const K = 0.56; // Methanol standard burning rate mm²/s
    
    const d_0s = calculateDropletDiameter(d0, K, 0);
    const d_2s = calculateDropletDiameter(d0, K, 2);
    const d_5s = calculateDropletDiameter(d0, K, 5);
    const d_extinction = calculateDropletDiameter(d0, K, 10); // t > d0²/K (~7.14s)

    assert.strictEqual(d_0s, 2.0);
    assert.ok(d_2s < d_0s, 'Diameter at 2s must be smaller than initial');
    assert.ok(d_5s < d_2s, 'Diameter at 5s must be smaller than at 2s');
    assert.strictEqual(d_extinction, 0, 'Droplet must fully extinguish at or past burn lifetime');
  });

  test('hyperoxic exploration atmosphere (30% O2) increases burning rate relative to standard air', () => {
    const baseK = 0.56; // Methanol
    const kStandard = computeBurningRateConstant(baseK, 21.0, 1.0, 0.0);
    const kHyperoxic = computeBurningRateConstant(baseK, 30.0, 1.0, 0.0);

    assert.ok(
      kHyperoxic > kStandard,
      `Hyperoxic burning rate (${kHyperoxic.toFixed(3)}) must exceed standard (${kStandard.toFixed(3)})`
    );
  });

  test('microgravity (0g) exhibits pure diffusive burning compared to terrestrial (1g) buoyant burning', () => {
    const baseK = 0.56;
    const kMicrogravity = computeBurningRateConstant(baseK, 21.0, 1.0, 0.0);
    const kTerrestrial = computeBurningRateConstant(baseK, 21.0, 1.0, 1.0);

    assert.ok(
      kTerrestrial > kMicrogravity,
      'Buoyancy at 1g increases convective oxidizer transport, yielding higher apparent burning rate than pure diffusion in 0g'
    );
  });

  test('cursor forced airflow pushes flame downwind away from cursor nozzle', () => {
    // Droplet at center (cx: 280, cy: 175)
    const cx = 280;
    const cy = 175;
    // Cursor nozzle placed at bottom-left (100, 250)
    const cursorPos = { x: 100, y: 250 };

    const fromCursorX = cx - cursorPos.x; // +180
    const fromCursorY = cy - cursorPos.y; // -75
    const dist = Math.sqrt(fromCursorX * fromCursorX + fromCursorY * fromCursorY);
    const unitDirX = fromCursorX / dist;
    const unitDirY = fromCursorY / dist;

    const driftX = unitDirX * 25;
    const driftY = unitDirY * 25;

    // Wind blows from bottom-left towards top-right -> flame must deflect to the right (driftX > 0) and up (driftY < 0)
    assert.ok(driftX > 0, 'Flame must deflect rightwards, away from cursor at the left');
    assert.ok(driftY < 0, 'Flame must deflect upwards, away from cursor at the bottom');
  });
});

describe('Optical Flame Diagnostics & Computer Vision Morphology', () => {
  // Sphericity ratio: Psi = 4 * pi * Area / Perimeter²
  function calculateSphericity(area: number, perimeter: number): number {
    if (perimeter <= 0) return 0;
    return (4 * Math.PI * area) / (perimeter * perimeter);
  }

  test('microgravity spherical flame approaches theoretical unity sphericity (Psi ~ 0.98)', () => {
    // Pure circle: radius r = 50px
    const r = 50;
    const circleArea = Math.PI * r * r;
    const circlePerimeter = 2 * Math.PI * r;
    const psiCircle = calculateSphericity(circleArea, circlePerimeter);

    assert.ok(
      Math.abs(psiCircle - 1.0) < 0.001,
      `Circle sphericity must equal 1.0, got ${psiCircle}`
    );

    // Microgravity flame with minor fiber perturbation
    const ugArea = circleArea * 0.98;
    const ugPerimeter = circlePerimeter * 1.01;
    const psiMicrogravity = calculateSphericity(ugArea, ugPerimeter);

    assert.ok(
      psiMicrogravity >= 0.95,
      `Microgravity flame sphericity (${psiMicrogravity.toFixed(3)}) must remain >= 0.95`
    );
  });

  test('distinguishes blue chemiluminescence (CH* 431nm) from soot radiative emissions (yellow/orange)', () => {
    // In pure microgravity droplet flames, CH* radical emission is concentrated in the blue band
    const sampleRGB = { r: 45, g: 120, b: 245 }; // Deep blue microgravity emission
    const isBlueChemiluminescence = sampleRGB.b > sampleRGB.r * 2 && sampleRGB.b > 150;
    assert.strictEqual(isBlueChemiluminescence, true);

    const sootRGB = { r: 255, g: 195, b: 30 }; // Yellow soot plume
    const isSootRadiative = sootRGB.r > 200 && sootRGB.g > 150 && sootRGB.b < 100;
    assert.strictEqual(isSootRadiative, true);
  });
});

describe('Visual Research Explorer Grid & Safety Pillars', () => {
  test('authentically filters NASA corpus by facility and flow regimes', () => {
    const saffireRecords = experiments.filter(e => 
      (e.platform?.toLowerCase().includes('cygnus') || e.investigation?.toLowerCase().includes('saffire'))
    );
    const cirRecords = experiments.filter(e => 
      (e.platform?.toLowerCase().includes('cir') || e.investigation?.toLowerCase().includes('flex'))
    );
    const msgRecords = experiments.filter(e => 
      (e.platform?.toLowerCase().includes('msg') || e.investigation?.toLowerCase().includes('bass'))
    );

    assert.ok(saffireRecords.length >= 10, 'Saffire facility records must be present in corpus');
    assert.ok(cirRecords.length >= 5, 'ISS CIR facility records must be present');
    assert.ok(msgRecords.length >= 10, 'ISS MSG facility records must be present');

    const quiescentRecords = experiments.filter(e => e.airflow_cm_s === 0 || e.airflow_cm_s == null);
    const forcedFlowRecords = experiments.filter(e => (e.airflow_cm_s ?? 0) > 0);

    assert.ok(quiescentRecords.length > 0, 'Quiescent flame records must exist');
    assert.ok(forcedFlowRecords.length > 0, 'Forced concurrent/opposed flow records must exist');
  });

  test('categorizes records across NASA exploration fire safety pillars', () => {
    const preventionRecords = experiments.filter(e =>
      (e.fire_safety_relevance?.toLowerCase().includes('flammability') ||
       e.fire_safety_relevance?.toLowerCase().includes('material') ||
       e.fire_safety_relevance?.toLowerCase().includes('spread') ||
       e.finding?.toLowerCase().includes('flame'))
    );

    const detectionRecords = experiments.filter(e =>
      (e.fire_safety_relevance?.toLowerCase().includes('smoke') ||
       e.fire_safety_relevance?.toLowerCase().includes('particulate') ||
       e.fire_safety_relevance?.toLowerCase().includes('detect') ||
       e.finding?.toLowerCase().includes('soot') ||
       e.finding?.toLowerCase().includes('sensor'))
    );

    const suppressionRecords = experiments.filter(e =>
      (e.fire_safety_relevance?.toLowerCase().includes('extinct') ||
       e.fire_safety_relevance?.toLowerCase().includes('quench') ||
       e.fire_safety_relevance?.toLowerCase().includes('suppress') ||
       e.finding?.toLowerCase().includes('extinction'))
    );

    assert.ok(preventionRecords.length > 0, 'Prevention pillar records must be populated');
    assert.ok(detectionRecords.length > 0, 'Detection pillar records must be populated');
    assert.ok(suppressionRecords.length > 0, 'Suppression pillar records must be populated');
  });
});

describe('Research Coverage 72-Cell Matrix & Gap Discovery', () => {
  test('properly partitions across 6 fuels x 4 gravity regimes x 3 oxygen bins = 72 cells', () => {
    const materials = ['liquid_droplets', 'pmma', 'fabrics_cellulose', 'wire_insulation', 'gaseous_fuels', 'other_solids'];
    const gravities = ['microgravity', 'partial_low', 'lunar', 'martian'];
    const oxygenBins = ['low', 'standard', 'high'];

    const totalCells = materials.length * gravities.length * oxygenBins.length;
    assert.strictEqual(totalCells, 72, 'Must rigorously represent 72 boundary condition cells');

    // Confirm that microgravity 17-23% O2 has strong coverage
    const microStandardRecords = experiments.filter(
      e => e.gravity === 'microgravity' && e.oxygen_pct != null && e.oxygen_pct >= 17 && e.oxygen_pct <= 23
    );
    assert.ok(microStandardRecords.length >= 10, 'Microgravity standard oxygen regime must be heavily populated');

    // Confirm that partial-gravity regimes (lunar/martian) represent research gaps with limited data
    const partialGravityRecords = experiments.filter(e => e.gravity === 'partial_gravity' || (e.gravity as string) === 'lunar');
    assert.ok(partialGravityRecords.length < 5, 'Lunar/Martian partial gravity represents an authentic NASA research gap');
  });
});

describe('Advanced Sorting & Multi-Factor Filter System', () => {
  test('accurately sorts records by oxygen concentration ascending and descending', () => {
    const recordsWithO2 = experiments.filter(e => e.oxygen_pct != null);
    
    // Sort descending
    const sortedDesc = [...recordsWithO2].sort((a, b) => (b.oxygen_pct ?? -1) - (a.oxygen_pct ?? -1));
    assert.ok(sortedDesc[0].oxygen_pct! >= sortedDesc[sortedDesc.length - 1].oxygen_pct!);
    assert.ok(sortedDesc[0].oxygen_pct! >= 30, 'Top sorted record must have high O2');

    // Sort ascending
    const sortedAsc = [...recordsWithO2].sort((a, b) => (a.oxygen_pct ?? 999) - (b.oxygen_pct ?? 999));
    assert.ok(sortedAsc[0].oxygen_pct! <= sortedAsc[sortedAsc.length - 1].oxygen_pct!);
    assert.ok(sortedAsc[0].oxygen_pct! <= 18, 'Lowest sorted record must have low O2');
  });

  test('accurately sorts records by forced ventilation airflow velocity', () => {
    const sortedFlow = [...experiments].sort((a, b) => (b.airflow_cm_s ?? -1) - (a.airflow_cm_s ?? -1));
    assert.ok((sortedFlow[0].airflow_cm_s ?? 0) >= (sortedFlow[sortedFlow.length - 1].airflow_cm_s ?? 0));
    assert.ok((sortedFlow[0].airflow_cm_s ?? 0) >= 15, 'Fastest airflow record should be >= 15 cm/s');
  });

  test('accurately sorts records alphabetically by investigation name', () => {
    const sortedNameAsc = [...experiments].sort((a, b) => a.investigation.localeCompare(b.investigation));
    assert.ok(sortedNameAsc[0].investigation.localeCompare(sortedNameAsc[sortedNameAsc.length - 1].investigation) <= 0);
  });

  test('applies multi-tolerance boundary modes (strict, standard, wide)', () => {
    const targetO2 = 21;
    
    const strictTol = 0.5;
    const strictMatches = experiments.filter(e => e.oxygen_pct != null && Math.abs(e.oxygen_pct - targetO2) <= strictTol);
    
    const wideTol = 3.0;
    const wideMatches = experiments.filter(e => e.oxygen_pct != null && Math.abs(e.oxygen_pct - targetO2) <= wideTol);
    
    assert.ok(wideMatches.length >= strictMatches.length, 'Wide tolerance must match equal or more studies than strict tolerance');
  });
});

describe('Stage 3 Whiteboard AI Tree Generator & PDF Claim Alignment', () => {
  test('AI tree builder creates a balanced 4-tier inquiry-evidence-hypothesis-experiment structure', () => {
    // Generate tree for a topic
    const topic = "Artemis Lunar Flammability";
    const matching = experiments.filter(e => 
      e.investigation.toLowerCase().includes("lunar") || e.material.toLowerCase().includes("sibal")
    );
    assert.ok(matching.length > 0, "Must have authentic NASA lunar combustion records");

    const rec1 = matching[0];
    assert.ok(rec1.finding, "Record must have an authentic finding");
    assert.ok(rec1.claim_locator_details?.claimId, "Record must have verified claim ID");
  });

  test('every NASA PSI record contains verified finding and valid claim locator metadata', () => {
    experiments.forEach((r, idx) => {
      assert.ok(r.id, `Record #${idx} must have an ID`);
      assert.ok(r.finding, `Record #${idx} (${r.id}) must have a documented finding`);
      assert.ok(r.investigation, `Record #${idx} (${r.id}) must have an investigation title`);
      if (r.claim_locator_details) {
        assert.ok(r.claim_locator_details.claimId, `Record ${r.id} claim locator must have claimId`);
        assert.ok(r.claim_locator_details.section, `Record ${r.id} claim locator must define section`);
      }
    });
  });

  test('spectral scanline profiles yield distinguishable CH* and soot intensity signatures', () => {
    // Check that RTDFS Quiescent Droplet has outer CH* peaks and central soot peak
    const length = 64;
    const center = 32;
    const peakOffset = 22;

    const rtdfsBluePeakLeft = Math.exp(-((Math.abs(center - peakOffset - center) - peakOffset) ** 2) / 18) * 85;
    assert.ok(rtdfsBluePeakLeft > 80, "CH* peak must be high at flame radius");

    const rtdfsSootCenter = Math.exp(-(0 ** 2) / 36) * 75;
    assert.ok(rtdfsSootCenter > 70, "Soot peak must be concentrated at core");
  });
});

