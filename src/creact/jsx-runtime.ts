import {
  criarNodo,
  type PropsT,
  type Nodo,
  type ComponentFn,
  type ChildrenT,
} from ".";

export function jsx<Props extends PropsT>(
  tag: string | ComponentFn<Props>,
  props: Props & {
    children?: Props["children"] extends (infer U)[] ? U : undefined;
  },
  key?: string,
): Nodo<Props> {
  return criarNodo<Props>(
    tag,
    {
      ...props,
      children: [props.children],
    },
    key,
  );
}

export function jsxs<Props extends PropsT>(
  tag: string | ComponentFn<Props>,
  props: Props,
  key?: string,
): Nodo<Props> {
  return criarNodo(tag, props, key);
}

export function jsxDEV<Props extends PropsT>(
  tag: string | ComponentFn<Props>,
  props: Props & {
    children?: Props["children"] extends (infer U)[] ? U | U[] : undefined;
  },
  key?: string,
): Nodo<Props> {
  const res = criarNodo<Props>(
    tag,
    {
      ...props,
      children: Array.isArray(props.children)
        ? props.children
        : [props.children],
    },
    key,
  );
  // console.log(res);
  return res;
}

export function Fragment(props: { children?: ChildrenT[] }) {
  return props.children;
}

jsx(Fragment, {});
