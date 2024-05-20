const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const PORT = 1000 || process.env.PORT;
const io = socketio(server);
const botName = 'Gossip.io';

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Run when client coonect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //welcome current user
        socket.emit('message', formatMessage(botName, 'welcome to Gossip.io!'));

        //broadcast when user coonects
        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage(botName, `${user.username} joined`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    })

    // console.log('New WS connection....');


    //listen for chatmessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        // console.log(msg);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    //runs when client discconetcs
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left`));

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });

        }

    })

})

server.listen(PORT, () => {
    console.log("server running");
})