"use client";

import { authClient } from "./auth-client";

export type ResearcherItemKind = "paper" | "brief" | "note" | "whiteboard";

export async function saveResearcherItem(kind: ResearcherItemKind, title: string, content: unknown) {
  if (!authClient) throw new Error("Account storage is not configured.");
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) throw new Error("Sign in to save your research.");
  const { error } = await authClient.from("researcher_items").insert({ owner_id: user.id, kind, title, content });
  if (error) throw new Error("Could not save your research. Please try again.");
}
