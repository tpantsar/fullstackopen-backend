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

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

//app.use(requestLogger);

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
  Person.findById(request.params.id).then((person) => {
    response.json(person);
  });
});

app.delete("/api/persons/:id", (request, response) => {
  Person.findByIdAndRemove(request.params.id).then((person) => {
    console.log(
      "Deleting %s with number %s from phonebook",
      person.name,
      person.number
    );
    response.status(204).end();
  });
});

app.post("/api/persons", (request, response) => {
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

  // Check if person name already exists in the phonebook
  Person.find({ name: body.name }).then((persons) => {
    if (persons.length > 0) {
      return response.status(400).json({
        error: "name must be unique",
      });
    }
  });

  const person = new Person({
    name: body.name,
    number: body.number,
    id: Math.floor(Math.random() * 1000),
  });

  person.save().then((savedPerson) => {
    console.log("Added %s with number %s to phonebook", body.name, body.number);
    response.json(savedPerson);
  });
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
