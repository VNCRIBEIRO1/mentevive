declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

interface Window {
  JitsiMeetExternalAPI?: new (
    domain: string,
    options: {
      roomName: string;
      parentNode: HTMLElement;
      width: string;
      height: string;
      configOverwrite: Record<string, unknown>;
      interfaceConfigOverwrite: Record<string, unknown>;
      userInfo: {
        displayName: string;
      };
    }
  ) => {
    addEventListener: (event: string, callback: () => void) => void;
    dispose: () => void;
  };
}
