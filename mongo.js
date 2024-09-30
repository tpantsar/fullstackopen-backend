const mongoose = require('mongoose')

console.log('arguments:', process.argv.length)

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]
const url = `mongodb+srv://tomipantsar:${password}@fullstackopen.qorqt.mongodb.net/phonebook?retryWrites=true&w=majority&appName=fullstackopen`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
  id: String,
})

const Person = mongoose.model('Person', personSchema)

// node mongo.js <password> <name> <number>
if (process.argv.length === 5) {
  const name = process.argv[3]
  const number = process.argv[4]
  const id = Math.floor(Math.random() * 1000)
  const person = new Person({
    name: name,
    number: number,
    id: id,
  })
  person.save().then((result) => {
    console.log('Added %s with number %s to phonebook', name, number)
    console.log(result)
    mongoose.connection.close()
  })
}
// node mongo.js <password>
else if (process.argv.length === 3) {
  Person.find({}).then((result) => {
    console.log('found %d persons from phonebook:\n', result.length)
    result.forEach((person) => {
      console.log(person.name, person.number)
    })
    mongoose.connection.close()
  })
} else {
  console.log('Invalid arguments')
}
