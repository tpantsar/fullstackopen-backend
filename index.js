const express = require('express')
const app = express()
require('dotenv').config()

const morgan = require('morgan')
app.use(express.static('dist'))

const Person = require('./models/person')

morgan.token('body', (req) => {
  console.log(req.body)
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  } else {
    return null
  }
})

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
)
app.use(requestLogger)

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/', (request, response) => {
  response.send('<h1>Persons phonebook</h1>')
})

app.get('/info', (request, response) => {
  Person.find({}).then((persons) => {
    response.send(
      `Phonebook has info for ${persons.length} people <br/> ${new Date()}`
    )
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).send({ error: 'person not found' })
      }
    })
    .catch((error) => {
      next(error)
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then((person) => {
      if (person) {
        console.log(
          'Deleted %s with number %s from phonebook',
          person.name,
          person.number
        )
        response.status(204).end()
      } else {
        response.status(404).json({ error: 'person not found' })
      }
    })
    .catch((error) => {
      next(error)
    })
})

app.post('/api/persons', async (request, response, next) => {
  const body = request.body

  if (body.name === undefined) {
    return response.status(400).json({
      error: 'name is missing',
    })
  }

  if (body.number === undefined) {
    return response.status(400).json({
      error: 'number is missing',
    })
  }

  try {
    // Check if person name already exists in the phonebook
    const persons = await Person.find({ name: body.name })
    if (persons.length > 0) {
      return response.status(400).json({
        error: 'name must be unique',
      })
    }

    const person = new Person({
      name: body.name,
      number: body.number,
      id: String(Math.floor(Math.random() * 1000)),
    })

    const savedPerson = await person.save()
    console.log('Added %s with number %s to phonebook', body.name, body.number)
    response.json(savedPerson)
  } catch (error) {
    next(error)
  }
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then((updatedPerson) => {
      response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
