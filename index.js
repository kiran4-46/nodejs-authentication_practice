const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'goodreads.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})
// create user API
app.post('/users/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectQuery = ` SELECT * FROM user 
  WHERE username = '${username}';`
  const dbUser = await db.get(selectQuery)

  if (dbUser === undefined) {
    //create username in database
    const createUserQuery = `INSERT INTO user 
    (username, name, password, gender, location) 
    VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`
    const dbResponse = await db.run(createUserQuery)
    response.send('User details created successfully')
  } else {
    // send invalid name as response
    response.status(400)
    response.send('user details already exists')
  }
})
// login user API
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM user 
WHERE username = '${username}';`
  const dbUser = await db.get(selectQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('user details unmatched')
  } else {
    // send invalid name as response
    const isIdmatched = await bcrypt.compare(password, dbUser.password)
    if (isIdmatched === true) {
      response.send('Login successful')
    } else {
      response.status(400)
      response.send('invalid user')
    }
  }
})
