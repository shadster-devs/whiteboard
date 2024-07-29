import { Db } from 'mongodb';

export interface Room {
    name: string;
    host: string;
    password: string;  // Add password field
    canvasData: string; // Data URL of the canvas
}

export async function createRoom(db: Db, room: Room) {
    const collection = db.collection('rooms');
    await collection.insertOne(room);
}

export async function getRoom(db: Db, name: string) {
    const collection = db.collection('rooms');
    return await collection.findOne({ name });
}

export async function updateCanvasData(db: Db, name: string, canvasData: string) {
    const collection = db.collection('rooms');
    await collection.updateOne({ name }, { $set: { canvasData } });
}
