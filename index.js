require('dotenv').config()
const express = require('express')
const cors = require('cors');
const app = express();
// const mongoose = require('mongoose');

const Note = require('./models/note')

// const password = "DIPF0mJkaq1d9u7a"
// const url = process.env.MONGODB_URI

// `mongodb+srv://monteyoon1998:${password}@notes-database.iv3awuc.mongodb.net/noteApp?retryWrites=true&w=majority`;

// mongoose.set('strictQuery', false);
// mongoose.connect(url)
//   .then(result => {
//   console.log('Connected to MongoDB');
//   })
//   .catch((error) => {
//   console.log("error coinnecting to MongoDB", error.message)
// })

// const noteSchema = new mongoose.Schema({
//   content: String,
//   important: Boolean,
// })

// noteSchema.set('toJSON', {
//   transform: (document, returnedObject) => {
//     returnedObject.id = returnedObject._id.toString()
//     delete returnedObject._id
//     delete returnedObject.__v
//   }
// })

// const Note = mongoose.model('Note', noteSchema);


const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(express.json())
app.use(requestLogger)
app.use(cors())
app.use(express.static('build'))

let notes = [
]


app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (req, res) => {
  Note.find({}).then(notes => {
    res.json(notes)
  })
})

// const generateId = () => {
//   const maxId = notes.length > 0
//     ? Math.max(...notes.map(n => n.id))
//     : 0
//   return maxId + 1
// }

app.post('/api/notes', (request, response) => {
  const body = request.body

  if (body.content === undefined) {
    return response.status(400).json({ 
      error: 'content missing' 
    })
  }

  // const note = {
  //   content: body.content,
  //   important: body.important || false,
  //   date: new Date(),
  //   id: generateId(),
  // }

  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  // notes = notes.concat(note)
  // response.json(note)


  note.save().then(savedNote => {
    response.json(savedNote);
  })
})

app.get('/api/notes/:id', (request, response) => {
  console.log(Note)
  Note.findById(request.params.id).then(note => {
    response.json(note)
  })
})

// app.get('/api/notes/:id', (request, response) => {
//   Note.findById(request.params.id).then(note => {
//     response.json(note)
//   })

//   // const id = Number(request.params.id)
//   // const note = notes.find(note => note.id === id)

//   // if (note) {
//   //   response.json(note)
//   // } else {
//   //   response.status(404).end()
//   // }

//   // response.json(note)
// })

app.delete('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id)
  notes = notes.filter(note => note.id !== id)

  response.status(204).end()
})

app.use(unknownEndpoint)

const PORT = process.env.PORT 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
