import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/mongodb';
import { getRoom, createRoom } from '../../models/Room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        if (req.method === 'POST') {
            const { action, username, room, password } = req.body;

            if (!username || !room || !password) {
                return res.status(400).json({ success: false, message: 'Missing fields' });
            }

            const { db } = await connectToDatabase();

            if (action === 'create') {
                // Check if room already exists
                const existingRoom = await getRoom(db, room);
                if (existingRoom) {
                    return res.status(400).json({ success: false, message: 'Room already exists' });
                }

                // Create a new room with the provided password
                await createRoom(db, { name: room, host: username, password, canvasData: '' });
                res.status(200).json({ success: true, isHost: true });
            } else if (action === 'join') {
                // Find the room and check the password
                const existingRoom = await getRoom(db, room);
                if (!existingRoom) {
                    return res.status(400).json({ success: false, message: 'Room does not exist' });
                }

                if (existingRoom.password === password) {
                    res.status(200).json({ success: true, isHost: false });
                } else {
                    res.status(401).json({ success: false, message: 'Invalid password' });
                }
            } else {
                res.status(400).json({ success: false, message: 'Invalid action' });
            }
        } else {
            res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Internal Server ${error}` });
    }
};

export default handler;
