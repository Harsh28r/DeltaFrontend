declare module 'tailwind-merge' {
  export function twMerge(
    ...classLists: Array<string | undefined | null | false>
  ): string;
  
  export default twMerge;
  
  export type Config = any;
  export type ClassValue = string | number | boolean | undefined | null | {
    [key: string]: any;
  } | ClassValue[];
  
  export function createTailwindMerge(config?: Config): typeof twMerge;
}

