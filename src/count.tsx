import { type ComponentFn, useSignal, criarNodo } from "./creact";

export const CounterJSX: ComponentFn<{ initialCount: number }> = (props) => {
  let [count, setCount] = useSignal<number>(props.initialCount);
  return (
    <div class="card">
      <button click={() => setCount(count() + 1)}>
        value: {count().toString()}
      </button>
    </div>
  );
};

export const CounterResultado: ComponentFn<{ initialCount: number }> = (
  props,
) => {
  let [count, setCount] = useSignal<number>(props.initialCount);
  return criarNodo(
    "div",
    { class: "card" },
    criarNodo(
      "button",
      { id: "counter", type: "button", click: () => setCount(count() + 1) },
      "value: ",
      count().toString(),
    ),
  );
};
