import { CounterJSX, CounterResultado, CounterSignal } from "./count";
import { h, renderizar, useSignal } from "./creact";
import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";

let app = h("div", null,
  h("a", { href: "https://vite.dev", target: "_blank" },
    h("img", { src: viteLogo, class: "logo", alt: "Vite logo" }),
  ),
  h("a", { href: "https://www.typescriptlang.org/", target: "_blank" },
    h("img", {
      src: typescriptLogo,
      class: "logo vanilla",
      alt: "TypeScript logo",
    }),
  ),
  h("h1", null, "Vite + TypeScript"),
  h(CounterJSX, { initialCount: 2 }),
  h(() => {
    let count = useSignal(5);
    return h(CounterSignal, {count});
  }, null),
  h(CounterResultado, { initialCount: 4 }),
  h("p", { class: "read-the-docs" },
    "Click on the Vite and TypeScript logos to learn more",
  ),
);
renderizar(app, document.querySelector<HTMLDivElement>("#app")!);
