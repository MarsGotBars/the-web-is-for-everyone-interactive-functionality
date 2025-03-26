if ("HTMLDialogElement" in window) {
  const form = document.querySelector("form");
  const createdDialog = document.createElement("dialog");
  document.body.append(createdDialog);
  const dialog = document.querySelector("dialog");
  dialog.appendChild(form);
} else {
  console.log("Dialog is not supported");
}
