require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const app = express();

const Person = require("./models/person");

morgan.token("body", (req) => {
  console.log(req.body);
  if (req.method === "POST") {
    return JSON.stringify(req.body);
  } else {
    return null;
  }
});

app.use(express.json());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body")
);
app.use(express.static("dist"));

app.get("/", (request, response) => {
  response.send("<h1>Persons phonebook</h1>");
});

app.get("/info", (request, response) => {
  Person.find({}).then((persons) => {
    response.send(
      `Phonebook has info for ${persons.length} people <br/> ${new Date()}`
    );
  });
});

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons);
  });
});

app.get("/api/persons/:id", (request, response) => {
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: "invalid ID format" });
  }

  Person.findById(id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).json({ error: "person not found" });
      }
    })
    .catch((error) => {
      response.status(500).json({ error: "internal server error" });
    });
});

app.delete("/api/persons/:id", (request, response) => {
  Person.findByIdAndDelete(request.params.id)
    .then((person) => {
      if (person) {
        console.log(
          "Deleted %s with number %s from phonebook",
          person.name,
          person.number
        );
        response.status(204).end();
      } else {
        response.status(404).json({ error: "person not found" });
      }
    })
    .catch((error) => {
      response.status(500).json({ error: "internal server error" });
    });
});

app.post("/api/persons", async (request, response) => {
  const body = request.body;

  if (body.name === undefined) {
    return response.status(400).json({
      error: "name is missing",
    });
  }

  if (body.number === undefined) {
    return response.status(400).json({
      error: "number is missing",
    });
  }

  try {
    // Check if person name already exists in the phonebook
    const persons = await Person.find({ name: body.name });
    if (persons.length > 0) {
      return response.status(400).json({
        error: "name must be unique",
      });
    }

    const person = new Person({
      name: body.name,
      number: body.number,
      id: String(Math.floor(Math.random() * 1000)),
    });

    const savedPerson = await person.save();
    console.log("Added %s with number %s to phonebook", body.name, body.number);
    response.json(savedPerson);
  } catch (error) {
    response.status(500).json({ error: "internal server error" });
  }
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
