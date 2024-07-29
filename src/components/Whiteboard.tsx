import React, { useRef, useEffect, MouseEvent } from 'react';
import { Socket } from 'socket.io-client';
import styles from './Whiteboard.module.scss';
import { Button } from 'shadster-ui';

interface WhiteboardProps {
    socket: Socket;
    room: string;
    username: string;
    color: string;
    brushSize: number;
    isHost: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ socket, room, username, color, brushSize, isHost }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const drawing = useRef(false);
    const lastPosition = useRef({ x: 0, y: 0 });
    const canvasDataRef = useRef<string | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        ctxRef.current = canvas.getContext('2d');
        if (!ctxRef.current) return;

        const ctx = ctxRef.current!;

        const handleDrawing = (data: any) => {
            const { x0, y0, x1, y1, color, brushSize } = data;
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        };

        const handleClearBoard = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        socket.on('drawing', handleDrawing);
        socket.on('clearBoard', handleClearBoard);

        return () => {
            socket.off('drawing', handleDrawing);
            socket.off('clearBoard', handleClearBoard);
        };
    }, [socket]);

    const startDrawing = (e: MouseEvent<HTMLCanvasElement>) => {
        drawing.current = true;
        const rect = canvasRef.current!.getBoundingClientRect();
        lastPosition.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const endDrawing = () => {
        drawing.current = false;
    };

    const draw = (e: MouseEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!ctx) return;

        const rect = canvas!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const data = {
            room,
            x0: lastPosition.current.x,
            y0: lastPosition.current.y,
            x1: x,
            y1: y,
            color,
            brushSize,
        };

        socket.emit('drawing', data);
        ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPosition.current = { x, y };
    };

    const clearBoard = () => {
        if (isHost && ctxRef.current) {
            ctxRef.current!.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            socket.emit('clearBoard', { room, username });
        }
    };

    const handleResize = () => {
        const canvas = canvasRef.current;
        if (canvas && ctxRef.current) {
            const dataUrl = canvas.toDataURL();
            canvasDataRef.current = dataUrl;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const ctx = ctxRef.current!;
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            if (canvasDataRef.current) {
                img.src = canvasDataRef.current!;
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize;
            }
        }
    }, [color, brushSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctxRef.current = ctx;
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize;
            }
        }

        const handleRequestCanvasData = (data: { username: string }) => {
            if (isHost && canvasRef.current) {
                const canvasData = canvasRef.current!.toDataURL();
                socket.emit('sendCanvasData', { room, canvasData });
            }
        };

        const handleReceiveCanvasData = (data: { canvasData: string }) => {
            const ctx = ctxRef.current;
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                };
                img.src = data.canvasData;
            }
        };

        socket.on('requestCanvasData', handleRequestCanvasData);
        socket.on('receiveCanvasData', handleReceiveCanvasData);

        window.addEventListener('resize', handleResize);

        return () => {
            socket.off('requestCanvasData', handleRequestCanvasData);
            socket.off('receiveCanvasData', handleReceiveCanvasData);
            window.removeEventListener('resize', handleResize);
        };
    }, [socket, isHost, room]);

    return (
        <div className={styles.container}>
            <div className={styles.tools}>
                <Button onClick={clearBoard} size={'sm'} variant={'primary'}>Clear Canvas</Button>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                />
            </div>
        </div>
    );
};

export default Whiteboard;
