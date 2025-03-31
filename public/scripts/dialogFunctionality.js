if ("HTMLDialogElement" in window) {
  const dialogOpen = document.querySelector(".opener");
  const dialogClose = document.querySelector(".close");
  const form = document.querySelector("form.dialog");
  if (form) {
    const createdDialog = document.createElement("dialog");
    document.body.append(createdDialog);
    const dialog = document.querySelector("dialog");
    dialog.appendChild(form);

    dialogOpen.addEventListener("click", (e) => {
      // Open modal
      dialog.showModal();
      // Na het openen wil ik er zeker van zijn dat ik niet door link
      e.preventDefault();
    });

    // Mogelijk dat deze onnodig is en ik wel direct terug naar de task wil
    dialogClose.addEventListener("click", (e) => {
      dialog.close();
      e.preventDefault();
    });
  }

  //   document.addEventListener('submit', async (e) =>{
  //     const submitForm = e.target

  //     e.preventDefault();

  //     const res = await fetch(submitForm.action){}
  //   })
} else {
  console.log("Dialog is not supported");
}
