export type Representation =
  | "original_media"
  | "source_figure"
  | "derived_plot"
  | "annotated_media"
  | "schematic"
  | "concept_animation";

export interface EvidenceLocator {
  sourceId: string;
  url: string;
  page?: number;
  figure?: string;
  table?: string;
  doi?: string;
  originalCaption?: string;
}

export interface ResearchAsset {
  id: string;
  experimentId: string;
  title: string;
  representation: Representation;
  format: "image" | "video" | "frames" | "svg";
  localPath?: string;
  externalUrl?: string;
  locator: EvidenceLocator;
  intervalSeconds?: number | null;
  frameCount?: number;
  framesPattern?: string; // e.g. "/nasa/sofie-gel/frames/frame_{index}.png"
  verificationStatus: "verified" | "needs_review";
  nasaCredit: string;
  processingNotes?: string;
}

export interface VisualScene {
  id: string;
  experimentId: string;
  title: string;
  kind: "setup" | "conditions" | "observation" | "findings" | "limitations";
  caption: string;
  referencedAssetId: string;
  sourceLocators: EvidenceLocator[];
  reviewed: boolean;
}

export interface VisualExperimentPackage {
  experimentId: string;
  investigation: string;
  programme: string;
  assets: ResearchAsset[];
  scenes: VisualScene[];
  apparatusDescription: string;
}
