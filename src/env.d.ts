/// <reference types="astro/client" />

declare module "virtual:icons/*" {
  import type { SVGProps } from "react";
  import type React from "react";
  const component: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
  export default component;
}
