export function MacWindowControls() {
  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } catch { /* not in Tauri */ }
  };

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } catch { /* not in Tauri */ }
  };

  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().toggleMaximize();
    } catch { /* not in Tauri */ }
  };

  return (
    <div className="mac-controls">
      <button className="mac-control close" onClick={handleClose} aria-label="Close" />
      <button className="mac-control minimize" onClick={handleMinimize} aria-label="Minimize" />
      <button className="mac-control maximize" onClick={handleMaximize} aria-label="Maximize" />
    </div>
  );
}
