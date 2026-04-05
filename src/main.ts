import { mountGame } from "./game";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) {
  throw new Error('Missing root element "#app"');
}

void mountGame(root).catch((err) => {
  console.error(err);
});
