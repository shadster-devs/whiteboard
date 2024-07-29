import type { NextApiRequest, NextApiResponse } from 'next';
import {getRoom} from "../../models/Room";
import {connectToDatabase} from "../../lib/mongodb";


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const { db } = await connectToDatabase();
        const room = await getRoom(db, req.query.room as string);
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(room));
        res.end();
    } catch (error) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({ error: 'Internal Server Error' }));
        res.end();
    }
};

export default handler;
