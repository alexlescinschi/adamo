import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;

if (!projectId) {
  throw new Error("SANITY_STUDIO_PROJECT_ID is required");
}

export default defineConfig({
  name: "adamo_content",
  title: "ADAMO.MD Content",
  projectId,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes },
  document: {
    actions: (actions, context) =>
      context.schemaType === "page" || context.schemaType === "contactSettings"
        ? actions.filter((action) => action.action !== "delete" && action.action !== "duplicate")
        : actions,
    newDocumentOptions: (templates) =>
      templates.filter((template) => template.templateId !== "page" && template.templateId !== "contactSettings"),
  },
});
