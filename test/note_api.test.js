const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require("../app");
const api = supertest(app); //REVIEW THIS!!
const Note = require('../models/note')
const helper = require("./test_helper");
const bcrypt = require('bcrypt')
const User = require("../models/user")

beforeEach(async () => {
    await Note.deleteMany({})
    await Note.insertMany(helper.initialNotes)
})


describe("when there is initially some notes saved", () => {
    test("notes are returned as json", async () => {
        await api
            .get("/api/notes")
            .expect(200)
            .expect("Content-Type", /application\/json/)
    })
    
    test('all notes are returned', async () => {
        const response = await api.get('/api/notes')
      
        expect(response.body).toHaveLength(helper.initialNotes.length)
      })
      
    test('a specific note is within the returned notes', async () => {
        const response = await api.get('/api/notes')
        const contents = response.body.map(r => r.content)
        expect(contents).toContain('Browser can execute only JavaScript') 
    })
})

describe("viewing a specific note", () => {
    test("succeeds with a valid id", async () => {
        const notesAtStart = await helper.notesInDb();
        const noteToView = notesAtStart[0]

        const resultNote = await api
            .get(`/api/notes/${noteToView.id}`)
            .expect(200)
            .expect("Content-Type", /application\/json/)

        expect(resultNote.body).toEqual(noteToView);
    })

    test("fails with statuscode 400 if id is invalid", async () => {
        const invalidId = '5a3d5da59070081a82a3445'

        await api.get(`/api/notes/${invalidId}`).expect(400)
    })

    test("fails with statuscode 404 if note does not exist", async () => {
        const validNonexistingId = await helper.nonExistingId()

        await api.get(`/api/notes/${validNonexistingId}`).expect(404)
    })
})

describe("addition of a new note", () => {
    test('a valid note can be added', async () => {
        const newNote = {
            content: "async/await simplifies making async calls",
            important: true,
        }
    
        await api
            .post("/api/notes")
            .send(newNote)
            .expect(201)
            .expect("Content-Type", /application\/json/)
    
        // const response = await api.get("/api/notes")
        // const contents = response.body.map(r => r.content)
        const notesAtEnd = await helper.notesInDb();
        expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)
    
        const contents = notesAtEnd.map(n => n.content)
        expect(contents).toContain("async/await simplifies making async calls")
    })

    test("note without content is not added", async () => {
        const newNote = {
            important: true
        }
    
        await api
            .post("/api/notes")
            .send(newNote)
            .expect(400)
    
        // const response = await api.get("/api/notes")
        const notesAtEnd = await helper.notesInDb()
        expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
    })
})

describe("deletion of a note", () => {
    test('A note can be delete', async () => {
        const notesAtStart = await helper.notesInDb();
        const noteToDelete = notesAtStart[0];
    
        await api
            .delete(`/api/notes/${noteToDelete.id}`)
            .expect(204)
    
            const notesAtEnd = await helper.notesInDb();
            expect(notesAtEnd).toHaveLength(helper.initialNotes.length - 1)
    
            const contents = notesAtEnd.map(note => note.content);
            expect(contents).not.toContain(noteToDelete.content)
    })
})

describe("when there is initially one user is db", () => {
    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: "root", passwordHash })
        
        await user.save();
    })

    test("creation suceeds with a fresh username", async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: "MonteY",
            name: "Monte Yoon",
            password: "Water123",
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect("Content-Type", /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(user => user.username)
        expect(usernames).toContain(newUser.username)
    })
})

describe("When there is initally one user in DB", () => {
    test("Creation fails with proper statuscode and message if username is already taken", async () => {
        const usersAtStart = await helper.usersInDb();

        const newUser = {
            username: "root",
            name: "Superuser",
            password: "Water123",
        }

        const result = await api
            .post("/api/users")
            .send(newUser)
            .expect(400)
            .expect("Content-Type", /application\/json/)

        expect(result.body.error).toContain(`expect ${newUser.username} to be unique`)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })
})


afterAll(async () => {
    await mongoose.connection.close()
})