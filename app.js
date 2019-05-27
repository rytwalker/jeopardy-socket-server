const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const uuid = require('uuid').v4;

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API Connected' });
});

const port = process.env.PORT || 5000;
http.listen(port, () => console.log(`Server started on port: ${port}`));

// Socket

let numUsers = 0;
let users = [];

io.on('connection', socket => {
  let addedUser = false;
  console.log('a user connected.');

  socket.emit('update users', { users });

  socket.on('update score', username => {
    console.log(username);
    users.forEach(u => {
      if (u.username === username) {
        u.score += 1;
      }
    });

    socket.broadcast.emit('score updated', { users });
  });

  socket.on('add user', username => {
    if (addedUser) return;

    socket.username = username;
    ++numUsers;
    addedUser = true;

    socket.emit('login', {
      numUsers: numUsers
    });
    // update users
    users.push({ username, score: 0, id: uuid() });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      users
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (addedUser) {
      --numUsers;
      for (let i = 0; i < users.length; i++) {
        if (users[i].username === socket.username) {
          users.splice(i, 1);
        }
      }
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
