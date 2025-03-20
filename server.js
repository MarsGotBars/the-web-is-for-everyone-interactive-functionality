import express from "express";
import { Liquid } from "liquidjs";

let taskData = [];
let exerciseData = [];
const fetchThemedTask = async () => {
  const taskList = await fetch(
    "https://fdnd-agency.directus.app/items/dropandheal_task"
  );
  // Skip hiermee het benoemen van 'data'
  const { data: taskListJson } = await taskList.json();
  taskData = taskListJson;
};

const fetchThemedExercise = async () => {
  const exerciseList = await fetch(
    "https://fdnd-agency.directus.app/items/dropandheal_exercise"
  );
  // Skip hiermee het benoemen van 'data'
  const { data: exerciseListJson } = await exerciseList.json();
  // Refresh de data voor de check
  exerciseData = exerciseListJson;
};

const fetchExerciseDrops = async (givenExercise) => {
  const messageList = await fetch(
    `https://fdnd-agency.directus.app/items/dropandheal_messages${
      givenExercise && `?filter[exercise][_eq]=${givenExercise}`
    }`
  );
  // Skip hiermee het benoemen van 'data'
  const { data: messageListJson } = await messageList.json();
  // Refresh de data voor de check
  return messageListJson;
};
const temporaryErrors = new Map();
const createError = (error, path) => {
  const errorKey = `${path}`;
  temporaryErrors.set(errorKey, error);
};

(async () => {
  try {
    await fetchThemedExercise();
    await fetchThemedTask();
  } catch (err) {
    console.log(err, "no connection");
  }
})();
const app = express();

// Middleware om errors te genereren
app.use((req, res, next) => {
  // Pad om te vergelijken
  const errorKey = `${req.path}`;
  // Als er op dit pad een error is, voeg die toe aan de response locals
  if (temporaryErrors.has(errorKey)) {
    res.locals.error = temporaryErrors.get(errorKey);
    // Verwijder de error nadat deze is gebruikt, zodat temporaryErrors leeg is
    temporaryErrors.delete(errorKey);
  }
  next();
});

app.use(express.static("public"));

const engine = new Liquid();
app.engine("liquid", engine.express());
app.use(express.urlencoded({ extended: true }));
app.set("views", "./views");

app.get("/", async function (request, response) {
  response.render("index.liquid");
});

// Dynamische parameter om te gebruiken bij het vinden van de correcte taskData
app.get("/:theme", async function (request, response) {
  // Custom lijst met alle task titles en pathNames
  const tasks = taskData.map((task) => ({
    title: task.title,
    pathName: task.theme,
    id: task.id,
  }));

  // Sla deze op voor leesbaarheid
  const requestedTheme = request.params.theme;

  // Zoek taskData dmv de gevraagde :theme
  const foundData = taskData.find((data) => data.theme === requestedTheme);

  if (!foundData) {
    return response.status(404).render("err.liquid");
  }

  // Destructureer om props makkelijk door te
  const { pathName, theme, title, id, exercise: exerciseList } = foundData;

  const exerciseInfo = exerciseList.map((exercise) => {
    return exerciseData.find((e) => e.id === exercise);
  });
  const exercises = exerciseInfo.map((exercise) => {
    return {
      ...exercise,
      // absoluut pad, altijd handig -Krijn
      pathName: `/${pathName}/${exercise.id}`,
    };
  });

  // respond met de gevraagde pagina & het behorende thema
  response.render(`task.liquid`, {
    theme,
    title,
    id,
    tasks,
    exercises,
  });
});

app.get("/:theme/:pageId", async function (request, response) {
  const { theme, pageId } = request.params;
  const foundData = taskData.find((data) => data.theme === theme);
  // - 1 omdat we door een array lopend die start op 0
  const exercise = exerciseData.find(
    (exercise) => exercise.id === foundData.exercise[pageId - 1]
  );
  if (!exercise) {
    return response.status(404).render("err.liquid");
  }
  const { title, description, image, type } = exercise;

  const { theme: foundTheme, id } = foundData;

  response.render(`exercise.liquid`, {
    foundTheme,
    title,
    description,
    id,
    pageId,
    image,
  });
});

app.get("/:theme/:pageId/comment", async function (request, response) {
  const { theme, pageId } = request.params;
  const foundData = taskData.find((data) => data.theme === theme);
  // - 1 omdat we door een array lopend die start op 0
  const exercise = exerciseData.find(
    (exercise) => exercise.id === foundData.exercise[pageId - 1]
  );
  if (!exercise) {
    return response.status(404).render("err.liquid");
  }
  const { title, description, image, type } = exercise;
  const { theme: foundTheme, id } = foundData;
  const open = true;
  
  // alle props die we willen meegeven aan de template
  const renderData = {
    foundTheme,
    title,
    description,
    id,
    image,
    pageId,
    open,
  };
  
  // Als res.locals.error bestaat, gebruik die (komt van middleware)
  if (response.locals.error) {
    renderData.error = response.locals.error;
  }
  
  response.render(`exercise.liquid`, renderData);
});

app.post("/:theme/:pageId/drops", async function (request, response) {
  const { theme, pageId } = request.params;
  const { person, message, anonymous } = request.body;
  
  // Get the exercise ID
  const foundData = taskData.find((data) => data.theme === theme);
  const exercise = exerciseData.find(
    (exercise) => exercise.id === foundData.exercise[pageId - 1]
  );
  
  if (!exercise) {
    return response.status(404).render("err.liquid");
  }
  
  try {
    const response = await fetch(
      "https://fdnd-agency.directus.app/items/dropandheal_messages",
      {
        method: "POST",
        body: JSON.stringify({
          exercise: exercise.id,
          text: message,
          from: anonymous ? "anoniem" : person,

        }),
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
      }
    );
    
    // Controleer of de response OK is (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    response.redirect(303, `/${theme}/${pageId}/drops`);
  } catch (error) {

    const errorRedirect = `/${theme}/${pageId}/comment`;
    createError('Er is een fout opgetreden bij het versturen van je bericht. Probeer het nogmaals.', errorRedirect);
    return response.redirect(errorRedirect);
  }
});

app.get("/:theme/:pageId/drops", async function (request, response) {
  const { theme, pageId } = request.params;
  const foundData = taskData.find((data) => data.theme === theme);
  const exercise = exerciseData.find(
    (exercise) => exercise.id === foundData.exercise[pageId - 1]
  );

  if (!exercise) {
    return response.status(404).render("err.liquid");
  }
  // Voer de fetch uit wanneer we de pagina bezoeken, deze staat hier met de aanname dat er vaak comments geplaatst worden
  const drops = await fetchExerciseDrops(exercise.id);

  response.render("drops.liquid", {
    drops,
  });
});

app.set("port", process.env.PORT || 8000);

app.listen(app.get("port"), function () {
  console.log(`Application started on http://localhost:${app.get("port")}`);
});
