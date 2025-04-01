if ("HTMLDialogElement" in window) {
  const dialogOpen = document.querySelector(".opener");
  const dialogClose = document.querySelector(".close");
  const form = document.querySelector("form.dialog");
  const dropContainer = document.querySelector(".drop-container");
  if (dropContainer) {
    dropContainer.style.display = "block";
  }
  if (form) {
    const formSubmit = form.querySelector("button[value='false']");
    const formConcept = form.querySelector("button[value='true']");
    const isExercise = form.dataset.exercise === "true";
    console.log(isExercise);
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

    let clickedButton = null;
    formSubmit.addEventListener(
      "click",
      () => (clickedButton = formSubmit.value)
    );
    formConcept.addEventListener(
      "click",
      () => (clickedButton = formConcept.value)
    );
    if (!isExercise) {
      document.addEventListener("submit", async (e) => {
        form.classList.add("loading");
        const submitForm = e.target;
        const formData = new FormData(submitForm);
        const formDataObject = Object.fromEntries(formData);

        const { message, person, anonymous, conceptId, exerciseId } = formDataObject;
        console.log(formDataObject);
        e.preventDefault();
        if (conceptId) {
          try {
            const res = await fetch(
              `https://fdnd-agency.directus.app/items/dropandheal_messages/${conceptId}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                  text: message,
                  from:
                    anonymous && clickedButton !== "true" ? "anoniem" : person,
                  date_created: new Date().toISOString(),
                  concept: clickedButton,
                }),
              }
            );
            if (!res.ok) {
              throw new Error("Network response was not ok");
            }
            dialog.close();
          } catch (error) {
            console.error("Error:", error);
            form.classList.add("error");
            form.classList.remove("loading");

            setTimeout(() => {
              dialog.classList.add("fade-out");
              setTimeout(() => {
                form.classList.remove("error");
                dialog.classList.remove("fade-out");
                dialog.close();
              }, 1000);
            }, 2000);
            return;
          }
        } else {
          console.log("else!");
          try {
            const res = await fetch(
              "https://fdnd-agency.directus.app/items/dropandheal_messages",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json;charset=UTF-8",
                },
                body: JSON.stringify({
                  exercise: exerciseId,
                  text: message,
                  from:
                    anonymous && clickedButton !== "true" ? "anoniem" : person,
                  concept: clickedButton,
                }),
              }
            );

            if (!res.ok) {
              throw new Error("Network response was not ok");
            }
            const responseText = await res.text()
            const parser = new DOMParser();
            const responseDOM = parser.parseFromString(responseText, "text/html");
            const main = responseDOM.querySelector("main");

            // Close the dialog after successful submission
            dialog.close();
          } catch (error) {
            console.error("Error:", error);
            form.classList.remove("loading");
            form.classList.add("error");
            setTimeout(() => {
              dialog.classList.add("fade-out");
              setTimeout(() => {
                form.classList.remove("error");
                dialog.classList.remove("fade-out");
                dialog.close();
              }, 500);
            }, 2000);
            return;
          }
        }
        console.log("success");
        form.classList.remove("loading");
        form.classList.add("success");
        setTimeout(() => {
        console.log("success");

          dialog.classList.add("fade-out");
          setTimeout(() => {
        console.log("success");
            form.classList.remove("success");
            dialog.classList.remove("fade-out");
            dialog.close();
          }, 500);
        }, 2000);
      });
    }
  }
} else {
  console.log("Dialog is not supported");
}
