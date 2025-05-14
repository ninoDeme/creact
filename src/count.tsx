import {
  type ComponentFn,
  useState,
  h as criarNodo,
  type Signal,
} from "./creact";

export const CounterJSX: ComponentFn<{ initialCount: number }> = (props) => {
  let [count, setCount] = useState<number>(props.initialCount);
  return (
    <>
      <div>TESTE</div>
      <div class="card">
        <button type="button" click={() => setCount(count + 1)}>
          valor: {count.toString()}
        </button>
      </div>
    </>
  );
};

export const CounterResultado: ComponentFn<{ initialCount: number }> = (
  props,
) => {
  let [count, setCount] = useState<number>(props.initialCount);
  return criarNodo(
    "div",
    { class: "card" },
    criarNodo(
      "button",
      { type: "button", click: () => setCount(count + 1) },
      "value: ",
      count.toString(),
    ),
  );
};

export const CounterSignal: ComponentFn<{ count: Signal<number> }> = (
  props,
) => {
  return (
    <div class="card">
      <button type="button" click={() => (props.count.value += 1)}>
        valor: {props.count.value}
      </button>
    </div>
  );
};
