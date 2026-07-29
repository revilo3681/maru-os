/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

declare module '*.svg' {
  const content: string;
  export default content;
}
