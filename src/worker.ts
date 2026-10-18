import materialText from "../STORY_MATERIALS.txt";
import { createApp } from "./app.ts";

const app = createApp(materialText);
export default { fetch: app } satisfies ExportedHandler;
