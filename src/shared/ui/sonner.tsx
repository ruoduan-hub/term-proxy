import { Toaster as SonnerToaster, toast } from "sonner";

function Toaster() {
  return (
    <SonnerToaster
      closeButton
      richColors
      position="bottom-right"
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}

export { Toaster, toast };
