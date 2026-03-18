interface OpenDockLogoProps {
  size?: number;
  className?: string;
}

export function OpenDockLogo({ size = 24, className }: OpenDockLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="OpenDock"
      style={{ width: size, height: "auto" }}
      className={`opacity-60 ${className ?? ""}`}
      draggable={false}
    />
  );
}
