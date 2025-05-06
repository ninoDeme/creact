type ChildrenT = (
  | Nodo
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | object
)[];

type DefaultProps = {
  key?: string;
};

type PropsT<C extends ChildrenT | undefined = ChildrenT | undefined> = Record<
  string,
  any
> &
  DefaultProps &
  (C extends undefined ? { children?: undefined } : { children: C });

type NodoEstado = {
  signals: any[];
  signalIndex: number;
  el: HTMLElement | undefined;
  children: Map<string, NodoEstado>;
  component: Nodo<any>;
};

export type Nodo<Props extends PropsT = PropsT> = {
  tag: string | ComponentFn<Props>;
  props: Props;
  key: string;
  [ComponentSymbol]: true;
};

const ComponentSymbol = Symbol("Component");

function isNodo(val: unknown): val is Nodo {
  return val != null && typeof val === "object" && ComponentSymbol in val;
}

export type ComponentFn<Props extends PropsT = PropsT> = (
  props: Props,
) => Nodo<any>;

export function criarNodo(
  tag: string,
  props: Omit<PropsT, "children"> | null,
  ...children: ChildrenT
): Nodo<PropsT>;
export function criarNodo<Props extends PropsT<undefined>>(
  tag: ComponentFn<Props>,
  props: Props extends { children?: ChildrenT }
    ? null | Omit<Props, "children">
    : Omit<Props, "children">,
): Nodo<Props>;
export function criarNodo<Props extends PropsT<ChildrenT>>(
  tag: ComponentFn<Props>,
  props: Props extends { children?: ChildrenT }
    ? null | Omit<Props, "children">
    : Omit<Props, "children">,
  ...children: Props["children"]
): Nodo<Props>;


export function criarNodo<Props extends PropsT>(
  tag: string | ComponentFn<Props>,
  props: Omit<Props, "children"> | null,
  ...children: ChildrenT
): Nodo<Props> {
  return {
    [ComponentSymbol]: true,
    tag,
    key: crypto.randomUUID(),
    props: { ...((props ?? {}) as Props), children: children },
  };
}

let currentComponent: NodoEstado | null = null;

export function useSignal<T>(
  def: T,
): [getter: () => T, setter: (newValue: T) => T | null] {
  const state = currentComponent;
  if (!state) {
    throw new Error("Not in component context");
  }
  let i = state.signalIndex;
  if (!(i in state.signals)) {
    state.signals[i] = def;
  }
  let val = state.signals[i];
  state.signalIndex += 1;
  return [
    () => val,
    (newValue) => {
      let oldValue = state.signals[i];
      state.signals[i] = newValue;
      setTimeout(() => renderizar(state.component, state));
      return oldValue ?? null;
    },
  ];
}

export function renderizar<Props extends PropsT>(
  comp: Nodo<Props>,
  state?: NodoEstado,
): HTMLElement {
  state ??= {
    signals: [],
    signalIndex: 0,
    el: undefined,
    component: comp,
    children: new Map(),
  };
  let el: HTMLElement;
  if (typeof comp.tag === "string") {
    el = document.createElement(comp.tag);
  } else {
    currentComponent = state;
    state.signalIndex = 0;
    let newComp = comp.tag(comp.props);
    currentComponent = null;
    el = renderizar(newComp);
  }

  if (state.el != null) {
    state.el.replaceWith(el);
  }
  state.el = el;

  if (comp.props != null) {
    for (let [name, value] of Object.entries(comp.props)) {
      if (name === 'children') {
        continue;
      }
      if (typeof value === "function") {
        el.addEventListener(name, value as any);
      } else {
        try {
          el.setAttribute(name, `${value}`);
        } catch (e) {
          console.log(name, value);
        }
      }
    }
  }
  let c = comp.props.children ?? [];
  let unusedChildren = new Set(state.children.keys());
  let children = c.map((val) => {
    if (isNodo(val)) {
      if (val.props.key) {
        val.key = `${comp.key}:${val.props.key}`;
      }
      unusedChildren.delete(val.key);
      return renderizar(val, state.children.get(val.key));
    }
    if (val == null) {
      return "";
    }
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch (_) {}
    }
    return `${val}`;
  });

  for (let key of unusedChildren) {
    state.children.delete(key);
  }

  el.append(...children);

  return el;
}
