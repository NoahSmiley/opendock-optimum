import "dotenv/config";
import { createApp } from "./app";

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`? OpenDock backend listening on http://localhost:${PORT}`);
});

