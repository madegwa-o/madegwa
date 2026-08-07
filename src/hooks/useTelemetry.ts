// hooks/useTelemetry.ts
import { useEffect, useRef, useState } from "react";

type Message = {
    topic: string;
    payload: string;
    timestamp: string;
};

export function useTelemetry(url = "ws://localhost:8080/ws") {
    const [messages, setMessages] = useState<Message[]>([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let reconnectTimer: ReturnType<typeof setTimeout>;

        function connect() {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => setConnected(true);
            ws.onclose = () => {
                setConnected(false);
                reconnectTimer = setTimeout(connect, 3000);
            };
            ws.onerror = () => ws.close();
            ws.onmessage = (event) => {
                const msg: Message = JSON.parse(event.data);
                setMessages((prev) => [...prev.slice(-99), msg]);
            };
        }

        connect();
        return () => {
            clearTimeout(reconnectTimer);
            wsRef.current?.close();
        };
    }, [url]);

    return { messages, connected };
}