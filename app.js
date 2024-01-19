const express = require('express')
const app = express()
const path = require('path')
const bcrypt = require('bcrypt')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())

let db = null
const dbPath = path.join(__dirname, 'userData.db')

const initializeServerAndDB = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  app.listen(3000, () => {
    console.log('Server Running at http://localhost:3000')
  })
}

initializeServerAndDB()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await db.get(getUserQuery)

  if (user === undefined) {
    if (password.length <= 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `
      INSERT INTO 
      user(username,name, password, gender, location)
      Values('${username}','${name}','${hashedPassword}','${gender}','${location}')`
      await db.run(createUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.get('/user', async (request, response) => {
  const getUsersQuery = `SELECT * FROM user`
  const dbResponse = await db.all(getUsersQuery)
  response.send(dbResponse)
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const user = await db.get(getUserQuery)
  if (user === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password)
    console.log(isPasswordMatched)
    if (isPasswordMatched) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const user = await db.get(getUserQuery)
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  if (user === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password)
    if (isPasswordMatched) {
      if (newPassword.length <= 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updateQuery = `UPDATE user 
        SET
        password ='${hashedPassword}'
        WHERE username='${username}'`

        await db.run(updateQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
