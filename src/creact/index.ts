import { Fragment } from "./jsx-runtime";

export type ChildrenT =
  | Nodo<any>
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | object;

type DefaultProps = {
  key?: string;
};

export type PropsT<
  C extends ChildrenT[] | undefined = ChildrenT[] | undefined,
> = Record<string, any> &
  DefaultProps &
  (C extends undefined ? { children?: undefined } : { children: C });

interface ComponentEstado {
  el: Element | Node[] | undefined;
  key: string;
  signals: any[];
  signalIndex: number;
  children: Map<string, ComponentEstado>;
  children_list: (ComponentEstado | undefined)[];
  component: Nodo;
  [ComponentSymbol]: true;
}

export type Nodo<Props extends PropsT = PropsT> = {
  tag: string | ComponentFn<Props>;
  props: Props;
  key?: string;
  [ComponentSymbol]: true;
};

const ComponentSymbol = Symbol("Component");

function isNodo(val: unknown): val is Nodo {
  return val != null && typeof val === "object" && ComponentSymbol in val;
}

export type ComponentFn<Props extends PropsT = PropsT> = (
  props: Props,
) => ChildrenT | ChildrenT[];

export function criarNodo<Props extends PropsT>(
  tag: string | ComponentFn<Props>,
  props: Props,
  key?: string,
): Nodo<Props> {
  return {
    [ComponentSymbol]: true,
    tag: tag ?? Fragment,
    key,
    props,
  };
}

export function h(
  tag: string,
  props: Omit<PropsT, "children"> | null | undefined,
  ...children: ChildrenT[]
): Nodo<PropsT>;
export function h<Props extends PropsT<undefined>>(
  tag: ComponentFn<Props>,
  props: Props extends { children?: ChildrenT }
    ? null | Omit<Props, "children">
    : Omit<Props, "children">,
): Nodo<Props>;
export function h<Props extends PropsT<ChildrenT[]>>(
  tag: ComponentFn<Props>,
  props: Props extends { children?: ChildrenT }
    ? null | Omit<Props, "children">
    : Omit<Props, "children">,
  ...children: Props["children"]
): Nodo<Props>;

export function h<Props extends PropsT>(
  tag: string | ComponentFn<Props>,
  props: Omit<Props, "children"> | null | undefined,
  ...children: ChildrenT[]
): Nodo<Props> {
  return criarNodo<Props>(tag, {
    ...((props ?? {}) as Props),
    children: [...(props?.children ?? []), ...children],
    key: props?.key || undefined,
  });
}

let currentComponent: ComponentEstado | null = null;

export function useState<T>(
  def: T,
): [getter: T, setter: (newValue: T) => T | null] {
  const state = currentComponent;
  if (!state) {
    throw new Error("Not in component context");
  }
  let i = state.signalIndex;
  if (!(i in state.signals)) {
    state.signals[i] = def;
  }
  let val = state.signals[i] as T;
  state.signalIndex += 1;
  return [
    val,
    (newValue) => {
      let oldValue = state.signals[i];
      if (oldValue !== newValue) {
        state.signals[i] = newValue;
        setTimeout(() => renderizar(state.component, undefined, state));
      }
      return oldValue ?? null;
    },
  ];
}

const SignalSymbol = Symbol("signal");

export interface Signal<T> {
  value: T;
  [SignalSymbol]: true;
}

interface PrivateSignal<T> extends Signal<T> {
  _raw: T;
  _components: Set<ComponentEstado>;
}

export function useSignal<T>(def: T): Signal<T> {
  const state = currentComponent;
  if (!state) {
    throw new Error("Not in component context");
  }
  let i = state.signalIndex;
  if (!(i in state.signals)) {
    state.signals[i] = <PrivateSignal<T>>{
      _raw: def,
      _components: new Set(),
      [SignalSymbol]: true,
      get value() {
        if (currentComponent && !this._components.has(currentComponent)) {
          this._components.add(currentComponent);
        }
        return this._raw;
      },
      set value(newValue: T) {
        this._raw = newValue;
        setTimeout(() => {
          let paraAtualizar = [...this._components];
          this._components.clear();
          for (let c of paraAtualizar) {
            renderizar(c.component, undefined, c);
          }
        });
      },
    };
  }
  let val = state.signals[i];
  state.signalIndex += 1;
  return val;
}

export function unwrapEstado(estado: ComponentEstado): Node[] {
  if (estado.el && Array.isArray(estado.el)) {
    return [...estado.el];
  }
  if (estado.el) {
    return [estado.el];
  }
  return [];
}

export function renderizar<Props extends PropsT>(
  comp: Nodo<Props>,
  parent?: Element,
  old_state?: ComponentEstado,
  key?: string,
): ComponentEstado {
  if (old_state && !(ComponentSymbol in old_state)) {
    old_state = undefined;
  }
  let state: ComponentEstado = {
    signals: [...(old_state?.signals ?? [])],
    signalIndex: 0,
    el: undefined,
    component: comp as Nodo,
    children: new Map(),
    children_list: [],
    key: old_state?.key ?? key ?? comp.key ?? `${crypto.randomUUID()}`,
    [ComponentSymbol]: true,
  };
  let children: ChildrenT[];
  if (typeof comp.tag === "string") {
    let el = document.createElement(comp.tag);
    for (let prop in comp.props) {
      if (prop !== "children") {
        if (typeof comp.props[prop] === "function") {
          el.addEventListener(prop, comp.props[prop]);
        } else if (comp.props[prop] != null) {
          el.setAttribute(prop, `${comp.props[prop]}`);
        }
      }
    }
    state.el = el;
    children = comp.props.children ?? [];
  } else {
    currentComponent = state;
    let newComp = comp.tag(comp.props);
    currentComponent = null;
    if (!Array.isArray(newComp)) {
      children = [newComp];
    } else {
      children = newComp;
    }
    state.el = [];
  }

  let i = -1;
  for (let val of children) {
    i++;
    if (isNodo(val)) {
      let key = val.props.key;
      if (!key) {
        if (children.length > 1) {
          console.warn("Key should be defined in lists");
        }
        key = `${state.key}:${crypto.randomUUID()}`;
      }
      let old_estado = val.props.key
        ? old_state?.children.get(key)
        : old_state?.children_list[i];
      let pai = parent;
      if (!Array.isArray(state.el)) {
        pai = state.el;
      }
      let new_estado: ComponentEstado;
      if (old_estado && !diffNodos(old_estado.component, val)) {
        new_estado = old_estado;
      } else {
        new_estado = renderizar(val, pai, old_estado, key);
      }
      state.children.set(key, new_estado);
      if (Array.isArray(state.el)) {
        state.el.push(...unwrapEstado(new_estado));
      } else {
        state.el.append(...unwrapEstado(new_estado));
      }
      state.children_list.push(new_estado);
    } else {
      let str: string;
      if (val == null) {
        str = "";
      } else if (typeof val === "object") {
        try {
          str = JSON.stringify(val);
        } catch (_) {
          console.warn("Unable to serialize object: ", val);
          str = `${val}`;
        }
      } else {
        str = `${val}`;
      }
      if (Array.isArray(state.el)) {
        state.el.push(document.createTextNode(str));
      } else {
        state.el.append(document.createTextNode(str));
      }
      state.children_list.push(undefined);
    }
  }

  if (Array.isArray(state.el)) {
    // state.el.unshift(document.createComment(state.key));
    // state.el.push(document.createComment("/" + state.key));
    state.el.unshift(document.createComment("element"));
    state.el.push(document.createComment("/element"));
  }
  if (parent) {
    parent.append(...unwrapEstado(state));
  } else if (old_state) {
    if (Array.isArray(old_state.el)) {
      let el = old_state.el[0] as ChildNode | null | undefined;
      let nextEl = old_state.el[0].nextSibling as ChildNode | null | undefined;
      do {
        el = nextEl;
        nextEl = el?.nextSibling;
        el?.remove();
      } while (el && el !== old_state.el[old_state.el.length - 1]);
      let state_els = unwrapEstado(state);
      let first = state_els.shift();
      let parentEl = old_state.el[0].parentElement;
      if (first) {
        parentEl?.replaceChild(first, old_state.el[0]);
        (first as ChildNode).after(...state_els);
      }
    } else {
      old_state.el?.replaceWith(...unwrapEstado(state));
    }
  }

  return state;
}

function diffNodos(a: Nodo, b: Nodo): boolean {
  for (let prop of new Set([
    ...Object.keys(b.props),
    ...Object.keys(a.props),
  ])) {
    if (a.tag !== b.tag) {
      return false;
    }
    if (prop === "children") {
      let a_children = a.props.children;
      let b_children = b.props.children;
      if (a_children?.length !== b_children?.length) {
        return true;
      }
      for (let i in a_children) {
        if (
          isNodo(a_children[i]) &&
          isNodo(b_children?.[i]) &&
          diffNodos(a_children[i], b_children[i])
        ) {
          return true;
        }
        if (a_children[i] != b_children?.[i]) {
          return true;
        }
      }
    } else if (a.props[prop] !== b.props[prop]) {
      return true;
    }
  }
  return false;
}
