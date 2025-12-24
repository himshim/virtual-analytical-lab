export function enableDrag(container) {
  let dragged;

  container.addEventListener("dragstart", e => {
    dragged = e.target;
  });

  container.addEventListener("dragover", e => {
    e.preventDefault();
  });

  container.addEventListener("drop", e => {
    e.preventDefault();
    if (e.target.classList.contains("sequence-item")) {
      container.insertBefore(dragged, e.target);
    }
  });
}