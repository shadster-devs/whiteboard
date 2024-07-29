import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import { connectToDatabase } from './src/lib/mongodb';
import { createRoom, getRoom, updateCanvasData } from './src/models/Room';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface DrawingData {
    room: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
    brushSize: number;
}

app.prepare().then(() => {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        const parsedUrl = parse(req.url!, true);
        const { pathname, query } = parsedUrl;
            handle(req, res, parsedUrl);
    });

    const io = new Server(server);

    io.on('connection', (socket: Socket) => {
        socket.on('createRoom', async (data: { room: string; username: string, password: string }) => {
            const { db } = await connectToDatabase();
            await createRoom(db, { name: data.room, host: data.username, canvasData: '' , password : data.password});
            socket.join(data.room);
        });

        socket.on('joinRoom', async (data: { room: string; username: string }) => {
            socket.join(data.room);
            const { db } = await connectToDatabase();
            const room = await getRoom(db, data.room);
            if (room && room.canvasData) {
                socket.emit('receiveCanvasData', { canvasData: room.canvasData });
            }
        });

        socket.on('sendCanvasData', async (data: { room: string; canvasData: string }) => {
            const { db } = await connectToDatabase();
            await updateCanvasData(db, data.room, data.canvasData);
            socket.to(data.room).emit('receiveCanvasData', { canvasData: data.canvasData });
        });

        socket.on('drawing', (data: DrawingData) => {
            io.to(data.room).emit('drawing', data);
        });

        socket.on('clearBoard', async (data: { room: string; username: string }) => {
            const { db } = await connectToDatabase();
            await updateCanvasData(db, data.room, '');
            io.to(data.room).emit('clearBoard');
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err?: Error) => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
