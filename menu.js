function initEscapeMenu() {
  const menu = document.getElementById("gameMenu");
  if (!menu) return;
  let visible = false;
  function toggle() {
    visible = !visible;
    menu.style.display = visible ? "block" : "none";
  }
  document.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      toggle();
    }
  });
}

document.addEventListener("DOMContentLoaded", initEscapeMenu);
